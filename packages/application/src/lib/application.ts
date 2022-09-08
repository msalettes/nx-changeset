import { package2 } from "@changeset/package2";
import { package3 } from "@changeset/package3";

export function application(): string {
  return 'application'+ package2() + package3() ;
}
