import {waitForAnimationFrame} from '@augment-vir/browser';
import {joinUrlParts, removePrefix} from '@augment-vir/common';
import {ToniqNftFrame} from '@toniq-labs/toniq-nft-frame';
import {defineElementNoInputs, html, listen} from 'element-vir';

/** Set this on the window so that playwright can use it. */
(window as any).waitForAnimationFrame = waitForAnimationFrame;

export const ToniqFrameGenApp = defineElementNoInputs({
    tagName: 'toniq-frame-gen-app',
    renderCallback({host}) {
        const currentPath = removePrefix({value: window.location.pathname, prefix: '/'});

        if (currentPath === 'iframe') {
            host.remove();
            import('@toniq-labs/toniq-nft-frame/dist/iframe/iframe-script');
            return 'loading iframe...';
        }

        return html`
            <${ToniqNftFrame.assign({
                childFrameUrl: joinUrlParts(window.location.href, 'iframe'),
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
            })}
                ${listen(ToniqNftFrame.events.settle, (event) => {
                    console.log(event.type);
                })}
            ></${ToniqNftFrame}>
        `;
    },
});
