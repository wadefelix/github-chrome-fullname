// @flow
import { API3 } from "./api"
import Restrictor from "./restrictor"

function timeout(time: number) {
    return new Promise(resolve => setTimeout(resolve, time))
}

declare var NodeFilter: any

export class NodeReplacer {
    private _api: API3
    private _idRegex: RegExp = /[di]\d{6}|c\d{7}/gi
    private _restrictor: Restrictor = new Restrictor

    public constructor(api: API3) {
        this._api = api
    }


    public async watch(element: Element) {
        await this.replaceEle(element)
        const observer = new MutationObserver(this._getChangeHandler())
        observer.observe(element, {
            childList: true,
            characterData: true,
            subtree: true
        })
        return this
    }

    public _getChangeHandler() {
        return (mutations: MutationRecord[], _observer: MutationObserver) => {
            for(const { target } of mutations) {
                this.replaceEle(target)
            }
        }
    }

    public async replaceEle(element: Node) {
        var commitauthorEles = document.getElementsByClassName('commit-author')
        var eles = document.getElementsByClassName('author')
        var authorEles  = Array.prototype.filter.call(eles, function(ele: Element) {
            return ele.hasAttribute('data-hovercard-type') && ele.getAttribute('data-hovercard-type') == "user";
        })
        // reviewers
        var assigneeEles = document.getElementsByClassName('assignee')

        // PR user and others
        eles = document.getElementsByClassName('Link--muted')
        var linkmutedEles = Array.prototype.filter.call(eles, function(ele: Element) {
            return ele.hasAttribute('data-hovercard-type') && ele.getAttribute('data-hovercard-type') == "user";
        })
        eles = document.getElementsByClassName('Link--primary')
        var linkprimaryEles = Array.prototype.filter.call(eles, function(ele: Element) {
            return ele.hasAttribute('data-hovercard-type') && ele.getAttribute('data-hovercard-type') == "user";
        })
        const pending = []
        for (var arr of [commitauthorEles, authorEles, assigneeEles, linkmutedEles, linkprimaryEles]) {
            for (var i = 0; i < arr.length; i++) {
                const curNode = arr[i];
                pending.push(this._replaceEle(curNode))
            }
        }
        await Promise.all(pending)
    }
    public async _replaceEle(node: Element) {
        if(!node.textContent) {
            return
        }
        const pending = []
        pending.push(this._replaceText(node.textContent, node))
        await Promise.all(pending)
    }
    public async _replaceText(id: string, node: Element) {
        if (id.includes("[")) {
            return
        }
        const user = await this._api.getUser(id, window.location.hostname)
        if(!user) {
            return
        }
        let userName = user.getName()
        if (userName && userName != "" && node.textContent) {
            node.textContent = node.textContent.replace(id, userName)
        }
    }

    public async replace(element: Node) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
        const pending = []
        let x = 0
        while(walker.nextNode()) {
            if(++x === 500) {
                x = 0
                await timeout(0)
            }
            const { currentNode } = walker
            pending.push(this._replaceNode(currentNode))
        }
        await Promise.all(pending)
    }

    public async _replaceNode(node: Node) {
        if(!node.nodeValue) {
            return
        }
        const ids = node.nodeValue.match(this._idRegex) || []
        if(ids.length <= 0 || !this._restrictor.check(node.parentElement)) {
            return
        }
        const pending = []
        for(const id of ids) {
            pending.push(this._replaceId(id, node))
        }
        await Promise.all(pending)
    }

    public async _replaceId(id: string, node: Node) {
        const user = await this._api.getUser(id, window.location.hostname)
        if(!user) {
            return
        }
        let userName = user.getName()
        if(userName && userName != "" && node.nodeValue ) {
            node.nodeValue = node.nodeValue.replace(id, this.decodeHTMLEntities(userName))
        }
    }

    // Solution from here: https://stackoverflow.com/questions/1147359/how-to-decode-html-entities-using-jquery/1395954#1395954
    private decodeHTMLEntities(encodedString: string) {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = encodedString;
        return textArea.value;
    }
}

