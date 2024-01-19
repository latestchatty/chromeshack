{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  # nativeBuildInputs is usually what you want -- tools you need to run
  nativeBuildInputs = with pkgs; [
    #playwright-driver.browsers
    nodejs_21
    nodePackages.pnpm
    nodePackages.typescript
  ];

  # warning: playwright-driver is often outdated
  #shellHook = ''
  #  export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
  #  export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
  #'';
}
