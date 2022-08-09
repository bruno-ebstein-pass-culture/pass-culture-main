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
    in
    ({
      devShells.${system}.default = mach-nix.lib.${system}.mkPythonShell {
        python = "python310";
      };
    })
  ;
}
