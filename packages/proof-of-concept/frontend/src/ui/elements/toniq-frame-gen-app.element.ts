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
                nftUrl: 'http://34.219.146.6:8080/content/447e0b82e6ed13801cd31bc363f9dc79169d0cac7a5d0434ae6f5a668f2f720ei0',
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
            })}></${ToniqNftFrame}>
        `;
    },
});
