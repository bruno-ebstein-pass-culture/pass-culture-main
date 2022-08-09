{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  inputs.nixpkgs-old.url = "github:nixos/nixpkgs/nixpkgs-21.11-darwin";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs =
    { self
    , nixpkgs
    , nixpkgs-old
    , flake-utils
    }:
    flake-utils.lib.eachDefaultSystem (system: {
      devShell =
        let
          pkgs = nixpkgs.legacyPackages.${system};
          pkgs-old = nixpkgs-old.legacyPackages.${system};
        in
        pkgs.mkShell {
          packages = with pkgs; [
            nix # ensure to have always the same version
            docker-compose # needed to run backend with `pc`
            pkgs-old.commitizen # needed by pre-commit hook
            jq # needed by some subscripts in `pc`
          ];
        };
    });
}
