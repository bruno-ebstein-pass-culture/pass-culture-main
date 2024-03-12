{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-darwin";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    ({
      devShells.${system}.default = pkgs.mkShell {
        packages = [
          pkgs.devbox
        ];
      };
    })
  ;
}
