module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // babel-preset-expo's "hermes-stable" profile (auto-selected when
          // Metro passes engine=hermes) skips #private class field transforms
          // for non-decorated classes, which the bundled hermesc rejects.
          // Pin to hermes-v0 so private fields are always transformed.
          unstable_transformProfile: 'hermes-v0',
        },
      ],
    ],
  };
};
