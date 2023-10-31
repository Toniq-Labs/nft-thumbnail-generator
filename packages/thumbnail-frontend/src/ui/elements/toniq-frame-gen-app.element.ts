import {waitForAnimationFrame} from '@augment-vir/browser';
import {joinUrlParts} from '@augment-vir/common';
import {ToniqNftFrame} from '@toniq-labs/toniq-nft-frame';
import {css, defineElementNoInputs, html} from 'element-vir';

/** Set this on the window so that playwright can use it. */
(window as any).waitForAnimationFrame = waitForAnimationFrame;

export const ToniqFrameGenApp = defineElementNoInputs({
    tagName: 'toniq-frame-gen-app',
    styles: css`
        :host {
            display: flex;
        }
    `,
    renderCallback() {
        return html`
            <${ToniqNftFrame.assign({
                childFrameUrl: joinUrlParts(window.location.href, 'iframe', 'iframe.html'),
                nftUrl: '',
                min: {
                    width: 300,
                    height: 300,
                },
                max: {
                    width: 300,
                    height: 600,
                },
                allowScrolling: false,
                loadWait: {
                    milliseconds: 500,
                },
                timeoutMs: 30_000,
            })}></${ToniqNftFrame}>
        `;
    },
});
