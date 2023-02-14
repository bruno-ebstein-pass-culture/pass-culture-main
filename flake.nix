{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  inputs.git-gamble.url = "gitlab:pinage404/git-gamble";
  inputs.git-gamble.inputs.nixpkgs.follows = "nixpkgs";
  inputs.git-gamble.inputs.flake-utils.follows = "flake-utils";

  outputs =
    { self
    , nixpkgs
    , flake-utils
    , git-gamble
    }:
    flake-utils.lib.eachDefaultSystem (system: {
      devShell =
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        pkgs.mkShell {
          packages = with pkgs; [
            nix # ensure to have always the same version
            docker-compose # needed to run backend with `pc`
            commitizen # needed by pre-commit hook
            jq # needed by some subscripts in `pc`
            git-gamble.packages.${system}.git-gamble # tools that blend TCR + TDD to make sure to develop the right thing, babystep by babystep
          ];
        };
    });
}
