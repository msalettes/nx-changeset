import { package1 } from "@changeset/package1";

export function package2(): string {
  const package1Text = package1();
  return `${package1Text}-package2`;
}
