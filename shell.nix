{ pkgs ? import <nixpkgs> { } }:
let
  coolifyVersion = "1.11.0"; # github.com/coollabsio/coolify-cli, not in nixpkgs
in
pkgs.mkShell {
  packages = with pkgs; [ nodejs_22 postgresql_16 go ];
  shellHook = ''
    # Project CLIs from devDependencies (elevenlabs, drizzle-kit, tsx).
    export PATH="$PWD/node_modules/.bin:$PATH"
    # Coolify CLI, built once per version into .bin/ (git-ignored).
    export GOBIN="$PWD/.bin/coolify-${coolifyVersion}"
    export PATH="$GOBIN:$PATH"
    if [ ! -x "$GOBIN/coolify" ]; then
      echo "Installing coolify-cli ${coolifyVersion}..."
      GOFLAGS=-modcacherw go install github.com/coollabsio/coolify-cli/coolify@v${coolifyVersion}
    fi
  '';
}
