const { withAndroidStyles } = require('expo/config-plugins');

module.exports = function (config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    const appTheme = styles.resources.style.find(
      (s) => s.$.name === 'AppTheme',
    );
    if (appTheme) {
      const existing = appTheme.item?.find(
        (i) => i.$.name === 'android:enforceNavigationBarContrast',
      );
      if (existing) {
        existing._ = 'false';
      } else {
        appTheme.item = appTheme.item || [];
        appTheme.item.push({
          $: { name: 'android:enforceNavigationBarContrast' },
          _: 'false',
        });
      }
    }
    return config;
  });
};
