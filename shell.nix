{ pkgs ? import <nixpkgs> { } }:
let
  coolifyVersion = "1.11.0"; # github.com/coollabsio/coolify-cli, not in nixpkgs
  verdaVersion = "1.10.0"; # github.com/verda-cloud/verda-cli, not in nixpkgs
in
pkgs.mkShell {
  packages = with pkgs; [ nodejs_22 postgresql_16 go ];
  shellHook = ''
    # Project CLIs from devDependencies (elevenlabs, drizzle-kit, tsx).
    export PATH="$PWD/node_modules/.bin:$PATH"
    # Go CLIs, built once per version into .bin/ (git-ignored).
    coolifyBin="$PWD/.bin/coolify-${coolifyVersion}"
    verdaBin="$PWD/.bin/verda-${verdaVersion}"
    export PATH="$coolifyBin:$verdaBin:$PATH"
    if [ ! -x "$coolifyBin/coolify" ]; then
      echo "Installing coolify-cli ${coolifyVersion}..."
      GOBIN="$coolifyBin" GOFLAGS=-modcacherw go install github.com/coollabsio/coolify-cli/coolify@v${coolifyVersion}
    fi
    if [ ! -x "$verdaBin/verda" ]; then
      echo "Installing verda-cli ${verdaVersion}..."
      GOBIN="$verdaBin" GOFLAGS=-modcacherw go install github.com/verda-cloud/verda-cli/cmd/verda@v${verdaVersion}
    fi
  '';
}
