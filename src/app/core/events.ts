interface ILiteEvent<T> {
    addHandler(handler: { (...args): void }): void;
    removeHandler(handler: { (...args): void }): void;
}

class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { (...args): void }[] = [];

    addHandler(handler: { (...args): void }): void {
        this.handlers.push(handler);
    }

    removeHandler(handler: { (...args): void }): void {
        this.handlers = this.handlers.filter((h) => h !== handler);
    }

    raise(...args) {
        this.handlers.slice(0).forEach((h) => h(...args));
    }

    expose(): ILiteEvent<T> {
        return this;
    }
}

export const fullPostsCompletedEvent = new LiteEvent<void>();
export const processPostEvent = new LiteEvent<any>();
export const processPostBoxEvent = new LiteEvent<any>();
export const processReplyEvent = new LiteEvent<any>();
export const processRefreshIntentEvent = new LiteEvent<any>();
export const processPostRefreshEvent = new LiteEvent<any>();
export const processEmptyTagsLoadedEvent = new LiteEvent<any>();
export const processTagDataLoadedEvent = new LiteEvent<any>();
