import { addNotification } from "$lib/stores";
import type { SdkToQnMessage_Hello } from "$lib/types/SdkToQnMessage";

export default function handleHello(msg: SdkToQnMessage_Hello) {
    // TODO: Only show this notification if the SDK Editor mod is not already "connected".
    addNotification.set({
        kind: "info",
        title: "SDK Editor Connected",
        subtitle: "The SDK Editor mod has established a connection to QNE!",
    })
}