import { package1 } from "@changeset/package1";
import { package2 } from "@changeset/package2";

export function package3(): string {
  console.log('package3');
  return package2() + '-package3' + '-' + package1();
}
