/**
 * Prisma 7 DMMF Patch for @adminjs/prisma
 *
 * Prisma 7 の DMMF は簡素化されており、@adminjs/prisma が必要とする
 * `isId`, `isRequired` などのプロパティが含まれていません。
 * このモジュールはパッチ済みのモデルを返す関数を提供します。
 */

// ID フィールド名のマッピング（モデル名 -> IDフィールド名）
// 複合キーを持つモデルは最初のキーフィールドを ID として扱う
const MODEL_ID_FIELDS: Record<string, string> = {
  User: "id",
  Source: "id",
  Category: "id",
  Article: "id",
  Interaction: "id",
  UserInterestVector: "id",
  Session: "id",
  Account: "id",
  Verification: "id",
  // 複合キーモデル - 最初のフィールドを擬似 ID として使用
  ArticleCategory: "articleId",
  UserCategoryPreference: "userId",
};

interface DMMFField {
  name: string;
  kind: string;
  type: string;
  isId?: boolean;
  isRequired?: boolean;
  isList?: boolean;
  isUnique?: boolean;
  isReadOnly?: boolean;
  hasDefaultValue?: boolean;
  isGenerated?: boolean;
  isUpdatedAt?: boolean;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
}

interface DMMFModel {
  name: string;
  fields: DMMFField[];
  dbName?: string | null;
  primaryKey?: { name: string | null; fields: string[] } | null;
  uniqueFields?: string[][];
  uniqueIndexes?: { name: string; fields: string[] }[];
}

/**
 * DMMF model に必要なプロパティを追加
 */
function patchModel(model: DMMFModel): DMMFModel {
  const idFieldName = MODEL_ID_FIELDS[model.name];

  const patchedFields = model.fields.map((field) => {
    const patchedField = { ...field };

    // ID フィールドをマーク
    if (patchedField.name === idFieldName) {
      patchedField.isId = true;
    }

    // 必須フィールドのデフォルト設定
    if (patchedField.kind === "scalar" && patchedField.isRequired === undefined) {
      patchedField.isRequired = true;
    }

    // その他のデフォルト値を設定
    if (patchedField.isList === undefined) {
      patchedField.isList = false;
    }
    if (patchedField.isUnique === undefined) {
      patchedField.isUnique = false;
    }
    if (patchedField.isReadOnly === undefined) {
      patchedField.isReadOnly = false;
    }
    if (patchedField.hasDefaultValue === undefined) {
      patchedField.hasDefaultValue =
        patchedField.name === "id" ||
        patchedField.name === "createdAt" ||
        patchedField.name === "updatedAt" ||
        patchedField.name === "fetchedAt";
    }
    if (patchedField.isGenerated === undefined) {
      patchedField.isGenerated = false;
    }
    if (patchedField.isUpdatedAt === undefined) {
      patchedField.isUpdatedAt = patchedField.name === "updatedAt";
    }

    return patchedField;
  });

  return {
    ...model,
    fields: patchedFields,
    primaryKey: model.primaryKey ?? (idFieldName ? { name: null, fields: [idFieldName] } : null),
    uniqueFields: model.uniqueFields ?? [],
    uniqueIndexes: model.uniqueIndexes ?? [],
  };
}

/**
 * @adminjs/prisma 互換のパッチ済みモデルを取得する
 * オリジナルの getModelByName の代わりに使用
 */
export function getPatchedModelByName(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientModule: any
): DMMFModel {
  const dmmf = clientModule?.Prisma?.dmmf?.datamodel;

  if (!dmmf?.models) {
    throw new Error("DMMF not found in Prisma module");
  }

  const model = dmmf.models.find(
    (m: DMMFModel) => m.name === name
  ) as DMMFModel | undefined;

  if (!model) {
    throw new Error(`Could not find model: "${name}" in Prisma's DMMF!`);
  }

  // Deep clone してパッチを適用
  const clonedModel: DMMFModel = JSON.parse(JSON.stringify(model));
  return patchModel(clonedModel);
}
