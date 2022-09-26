
const getVersionMessage = (
  releasePlan,
  options
) => {
  const skipCI = options?.skipCI === "version" || options?.skipCI === true;
  const publishableReleases = releasePlan.releases.filter(
    (release) => release.type !== "none"
  );

  const release = publishableReleases[0];
  const [_, packageName] = release.name.split('/');

  return `release(${packageName}): new version ${release.newVersion}\n
    ${skipCI ? `\n[skip ci]\n` : ""}`;
};

module.exports = { getVersionMessage};
