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
        var commitauthor_eles = document.getElementsByClassName('commit-author')
        var eles = document.getElementsByClassName('author')
        var author_eles  = Array.prototype.filter.call(eles, function(ele: Element) {
            return ele.hasAttribute('data-hovercard-type') && ele.getAttribute('data-hovercard-type') == "user";
        })
        eles = document.getElementsByClassName('Link--muted')
        var linkmuted_eles = Array.prototype.filter.call(eles, function(ele: Element) {
            return ele.hasAttribute('data-hovercard-type') && ele.getAttribute('data-hovercard-type') == "user";
        })
        const pending = []
        for (var i = 0; i < commitauthor_eles.length; i++) {
            const curNode = commitauthor_eles[i]
            pending.push(this._replaceEle(curNode))
        }
        for (var i = 0; i < author_eles.length; i++) {
            const curNode = author_eles[i]
            pending.push(this._replaceEle(curNode))
        }
        for (var i = 0; i < linkmuted_eles.length; i++) {
            const curNode = linkmuted_eles[i]
            pending.push(this._replaceEle(curNode))
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
        const user = await this._api.getUser(id, window.location.hostname)
        if(!user) {
            return
        }
        let userName = user.getName()
        if(userName && userName != "" && node.textContent) {
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

