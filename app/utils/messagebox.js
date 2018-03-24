
// todo: enhance UI via Dialog
// import { Dialog } from 'primereact/components/dialog/Dialog';

// todo: refine the interface, discard Promise, use .ok/.cancel instead.
export class MessageBox {
  constructor() {
    this.final = false;   // whether accept new messages.
  }

  // sample usage:
  // alert(s1, s2).ok(() => {console.log('after clicked ok.')});
  alert(caption, text, final = false) {
    if (!this.final) {
      this.final = final;

      window.alert(`${caption}\n${text})`);
      return { ok: cb => cb() };
    }
  }

  // confirm(caption, text) {
  //   if (!this.final) {
  //     // todo:
  //   }
  // }
}

// export instance of Notifications directly
export default new MessageBox();
