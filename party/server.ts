import { onConnect } from "y-partykit";
import type { Party } from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly party: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // This handles all the Yjs real-time collaboration logic automatically
    return onConnect(conn, this.party, { persist: true });
  }
}
