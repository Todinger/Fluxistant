PUSHD .

CD /D %~dp0\src
node main.js --compile-configs

POPD
