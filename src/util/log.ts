'use strict';

export function TDPALog(msg: string) {
    let d = new Date();
    console.log(`${d.toISOString()}: ${msg}`);
}
