/* eslint @typescript-eslint/no-unused-vars: "off" */

import type { ResolvedUser } from "../optional/highlight_users";
import type {
    CollapsedPostEventArgs,
    JumpToPostEventArgs,
    PendingPostEventArgs,
    PostboxEventArgs,
    PostEventArgs,
} from "./events.d";
import type { NotifyResponse } from "./notifications.d";

interface LiteEventInterface<T> {
    addHandler(handler: { (...args: T[]): void }): void;
    removeHandler(handler: { (...args: T[]): void }): void;
}

class LiteEvent<T> implements LiteEventInterface<T> {
    private handlers: { (...args: T[]): void }[] = [];

    addHandler(handler: { (...args: T[]): void }): void {
        this.handlers.push(handler);
    }

    removeHandler(handler: { (...args: T[]): void }): void {
        this.handlers = this.handlers.filter((h) => h !== handler);
    }

    raise(...args: T[]) {
        this.handlers.slice(0).forEach((h) => h(...args));
    }

    expose(): LiteEventInterface<T> {
        return this;
    }
}

export const fullPostsCompletedEvent = new LiteEvent<void>();
export const processPostEvent = new LiteEvent<PostEventArgs>();
export const processPostBoxEvent = new LiteEvent<PostboxEventArgs>();
export const processReplyEvent = new LiteEvent<PostEventArgs>();
export const processRefreshIntentEvent = new LiteEvent<PostEventArgs>();
export const processPostRefreshEvent = new LiteEvent<PostEventArgs>();
export const processEmptyTagsLoadedEvent = new LiteEvent<PostEventArgs>();
export const processTagDataLoadedEvent = new LiteEvent<PostEventArgs>();
export const processNotifyEvent = new LiteEvent<NotifyResponse>();
// react app events
export const collapsedPostEvent = new LiteEvent<CollapsedPostEventArgs>();
export const pendingPostsUpdateEvent = new LiteEvent<PendingPostEventArgs>();
export const userFilterUpdateEvent = new LiteEvent<ResolvedUser>();
export const hpnpJumpToPostEvent = new LiteEvent<JumpToPostEventArgs>();
export const submitFormEvent = new LiteEvent<Event>();
