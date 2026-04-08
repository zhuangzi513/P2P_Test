const ci = require('miniprogram-ci');
const path = require('path');

const projectConfig = {
  appid: 'wxffe63b8bf92fea11',
  type: 'miniProgram',
  projectPath: path.resolve(__dirname, 'dist'),
  privateKeyPath: path.resolve(__dirname, 'private.wxffe63b8bf92fea11.key'),
  ignores: ['node_modules/**/*'],
};

async function runPreview() {
  console.log('start....');
  try {
    const project = new ci.Project(projectConfig);
    console.log('new project done');

    console.log('building npm...');
    ci.packNpm(project, {
      ignores: ['node_modules/**/*'],
      reporter: (infos) => {
        console.log(infos);
      }
    });

    const previewResult = ci.preview({
      project,
      desc: 'check',
      setting: {
        es6: true,
        es7: true,
        minify: true,
      },
      onProgressUpdate: (progress) => {
        console.log('progress: ${progress}');
      },
    });

    console.log('check previewResult:', previewResult);
    console.log('check previewResult.qrcode:', previewResult.qrcode);
    if (previewResult && previewResult.qrcode) {
      console.log('📱 预览二维码链接:', previewResult.qrcode);
    }
    return { success: true, qrcode: previewResult?.qrcode };

  } catch (error) {
    console.error('failed:', error.message);
    
    const errorMsg = error.message || '';
    let friendlyError = '';
    
    if (errorMsg.includes('41001')) {
      friendlyError = '错误码 41001：缺少 access_token。请检查私钥文件是否正确，AppID 是否匹配，以及 IP 是否在白名单中。';
    } else if (errorMsg.includes('80200')) {
      friendlyError = '错误码 80200：代码包体积超过限制。请检查主包体积是否超过 2MB，或考虑使用分包加载。';
    } else if (errorMsg.includes('20003')) {
      friendlyError = '错误码 20003：上传/预览失败。可能是网络问题或服务端临时故障，请稍后重试。';
    } else if (errorMsg.includes('503')) {
      friendlyError = '错误码 503：服务不可用。微信服务端可能临时出现问题，建议稍后重试。';
    } else if (errorMsg.includes('privateKeyPath should not be empty')) {
      friendlyError = '私钥路径未配置。请检查 privateKeyPath 是否正确设置，并确保密钥文件存在。';
    } else {
      friendlyError = `未知错误: ${errorMsg}`;
    }
    
    console.error(`${friendlyError}`);
    return { success: false, error: { code: extractErrorCode(errorMsg), message: friendlyError } };
  }
}

function extractErrorCode(msg) {
  const match = msg.match(/\b(41001|80200|20003|503)\b/);
  return match ? match[1] : 'unknown';
}

runPreview().then((result) => {
  if (!result.success) {
    process.exit(1);
  }
});

if (require.main === module) {
  runPreview().catch(console.error);
}
module.exports = { runPreview };
