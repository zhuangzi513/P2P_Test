const ci = require('miniprogram-ci');
const path = require('path');

(async () => {
  const project = new ci.Project({
    appid: 'wxffe63b8bf92fea11',
    type: 'miniProgram',
    projectPath: path.resolve(__dirname, 'dist'),
    privateKeyPath: path.resolve(__dirname, 'private.wxffe63b8bf92fea11.key'),
    ignores: ['node_modules/**/*'],
  });

  const setting = {
    es6: true,
    es7: true,
    minify: true,
    minifyWXML: true,
    minifyWXSS: true,
  };

  const uploadResult = await ci.upload({
    project,
    version: '1.0.0',
    desc: 'miniprogram-ci ',
    setting: setting,
    robot: 1,
    onProgressUpdate: console.log,
  });

  console.log('uploadResult:', uploadResult);
})();
