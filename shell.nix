{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    docker-compose
    jq
    commitizen
  ];
}
