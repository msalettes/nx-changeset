import { package1 } from "@changeset/package1";

export function package2(): string {
  const package1Text = package1();
  console.log(`package2`);
  return `${package1Text}-package2`;
}
