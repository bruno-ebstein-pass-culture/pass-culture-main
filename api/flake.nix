{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

  inputs.pypi-deps-db.url = "github:DavHau/pypi-deps-db";

  inputs.mach-nix.url = "github:DavHau/mach-nix";
  inputs.mach-nix.inputs.nixpkgs.follows = "nixpkgs";
  inputs.mach-nix.inputs.pypi-deps-db.follows = "pypi-deps-db";

  outputs =
    { self
    , nixpkgs
    , pypi-deps-db
    , mach-nix
    }:
    let
      system = "x86_64-darwin";
      pkgs = nixpkgs.legacyPackages.${system};
      debug = pkgs.lib.debug; # `debug.traceValSeqN 1`
      python = mach-nix.lib.${system}.mkPython {
        python = "python310";
      };
      tools_to_interact_with_k8s = with pkgs; [
        google-cloud-sdk
        kubectl
        kubectx
      ];
      devShell = pkgs.mkShell {
        packages = [
          python
          pkgs.postgresql # needed by psycopg2
        ]
        ++ tools_to_interact_with_k8s
        ;
      };
    in
    ({
      devShells.${system} = {
        default = devShell; # needed by `nix develop`
        devShell.${system} = devShell; # needed by `use flake` in `.envrc`
      };
    })
  ;
}
