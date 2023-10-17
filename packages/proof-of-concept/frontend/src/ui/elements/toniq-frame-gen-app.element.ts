import {joinUrlParts} from '@augment-vir/common';
import {ToniqNftFrame} from '@toniq-labs/toniq-nft-frame';
import {defineElementNoInputs, html} from 'element-vir';

export const ToniqFrameGenApp = defineElementNoInputs({
    tagName: 'toniq-frame-gen-app',
    renderCallback({host}) {
        if (window.location.pathname === '/iframe') {
            host.remove();
            import('@toniq-labs/toniq-nft-frame/dist/iframe/iframe-script');
            return 'loading iframe...';
        }

        return html`
            <${ToniqNftFrame.assign({
                childFrameUrl: joinUrlParts(window.location.href, 'iframe'),
                nftUrl: '/content/323f84489a431d9bccb8f7d40771b0fe1c914b41418a0981c336811908c63c8bi0',
                max: {
                    width: 600,
                    height: 600,
                },
                min: {
                    width: 600,
                    height: 600,
                },
            })}></${ToniqNftFrame}>
        `;
    },
});
