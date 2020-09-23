export abstract class Client {
    queue: any[] = [];
    interval: number = 50;
    activeCandidateEvents: any = {
        confirmed: {},
        contaminated: {}
    };
    contaminations: any = {};

    constructor(
        public readonly maxWaitTime = 5000
    ) {
        this.waitForEvolv(this.configureListeners.bind(this));
    }

    private configureListeners() {
        window.evolv.client.on('confirmed', (type: string) => {
            this.sendMetricsForActiveCandidates(type);
        });
    }

    sendMetricsForActiveCandidates(type: string) {
        let contextKey = this.getContextKey(type);
        let candidates = this.getEvolv().context.get(contextKey) || [];
        for (let i = 0; i < candidates.length; i++) {
            if (this.activeCandidateEvents[type] && !this.activeCandidateEvents[type][candidates?.[i]?.cid]) {
                const allocation = this.lookupFromAllocations(candidates[i].cid);
                this.sendMetrics(type, allocation);
               this.activeCandidateEvents[type][candidates[i].cid] = true;
            }
        }
    }

    private lookupFromAllocations(cid: string) {
        let allocations = this.getEvolv().context.get('experiments').allocations;
        for (let i = 0; i < allocations.length; i++) {
            const allocation = allocations[i];

            if (allocation.cid === cid) {
                return allocation;
            }
        }
    }

    private getContextKey(type: string) {
        switch (type) {
            case 'confirmed':
                return 'confirmations';
            case 'contaminated':
                return 'contaminations';
            default:
                return '';
        }
    }

    getEvolv() {
        return window.evolv;
    }

    waitForEvolv(functionWhenReady: Function) {
        if (this.getEvolv()) {
            functionWhenReady && functionWhenReady();
            return;
        }

        const begin = Date.now();
        const intervalId = setInterval(() => {
            if ((Date.now() - begin) > this.maxWaitTime) {
                clearInterval(intervalId);
                console.log('Evolv: Analytics integration timed out - couldn\'t find Evolv');
                return;
            }

            const evolv = this.getEvolv();
            if (!evolv) {
                return;
            }

            functionWhenReady && functionWhenReady();

            clearInterval(intervalId);
        }, this.interval);
    }

    getAugmentedCidEid(event: any) {
        let augmentedCidEid;
        if (event.cid) {
            var cidEid = event.cid.split(':');
            augmentedCidEid = 'cid-' + cidEid[0] + ':eid-' + cidEid[1];

            let remaining = cidEid.slice(2).join(':');
            if (remaining) {
                augmentedCidEid = augmentedCidEid + ':' + remaining;
            }
        } else {
            augmentedCidEid = '';
        }

        return augmentedCidEid;
    }

    getAugmentedUid(event: any) {
        let augmentedUid = '';
        if (event.uid) {
            augmentedUid = "uid-" + event.uid;
        }
        return augmentedUid;
    }

    getAugmentedSid() {
        let augmentedSid = '';
        if (window.evolv.context.sid) {
            augmentedSid = 'sid-' + window.evolv.context.sid;
        }

        return augmentedSid;
    }

    abstract sendMetrics(type: string, event: any): void;
}
