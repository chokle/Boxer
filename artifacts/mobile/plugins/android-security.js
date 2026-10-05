const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function androidSecurity(config) {
  config = withAndroidManifest(config, config => {
    const application = config.modResults.manifest.application[0].$;
    application['android:allowBackup'] = 'false';
    application['android:fullBackupContent'] = 'false';
    application['android:dataExtractionRules'] = '@xml/boxer_data_extraction_rules';
    application['android:usesCleartextTraffic'] = 'false';
    return config;
  });
  return withDangerousMod(config, ['android', async config => {
    const dir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    fs.mkdirSync(dir, { recursive: true });
    const exclusions = ['root','file','database','sharedpref','external'].map(domain => `<exclude domain="${domain}" path="." />`).join('\n');
    fs.writeFileSync(path.join(dir, 'boxer_data_extraction_rules.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules><cloud-backup>${exclusions}</cloud-backup><device-transfer>${exclusions}</device-transfer></data-extraction-rules>\n`);
    return config;
  }]);
};
