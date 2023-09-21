import { flatten } from 'lodash';

export class Delta {

  constructor(delta) {
    this.delta = delta;
  }

  get inserts() {
    return flatten(this.delta.map(changeSet => changeSet.inserts));
  }

  get deletes() {
    return flatten(this.delta.map(changeSet => changeSet.deletes));
  }

  getInsertsFor(predicate) {
    return this.inserts
      .filter(t => t.predicate.value === predicate)
      .map(t => t.subject.value);
  }

  getDeletesFor(predicate) {
    return this.deletes
      .filter(t => t.predicate.value === predicate)
      .map(t => t.subject.value);
  }
}
