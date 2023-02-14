import { moveTriples } from "../support";
import { Changeset } from "../types";

export default async function dispatch(changesets: Changeset[]) {
	for (const changeset of changesets) {
		await moveTriples([
			{
				inserts: changeset.inserts,
				deletes: changeset.deletes,
			},
		]);
	}
}