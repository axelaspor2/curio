{
  description = "Curio - AI-powered Personalized Curation Platform";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            # Node.js & Package Manager
            nodejs_22
            pnpm_10

            # Database
            postgresql_17

            # Infrastructure
            terraform
            google-cloud-sdk

            # Development Tools
            jq
            curl
            docker-compose
          ];

          shellHook = ''
            echo "Curio development environment"
            echo "Node.js: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo "PostgreSQL: $(psql --version)"
          '';

          # Environment variables
          DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/curio?schema=public";
        };
      }
    );
}
