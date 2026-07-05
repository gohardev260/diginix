/**
 * DiginixIT UI System Components (shadcn/ui Pattern)
 * Scalable, component-first factory library for Buttons, Cards, Modals, Tables, Forms, Badges, and UX State Blocks.
 */

(function () {
    'use strict';

    const UIComponents = {
        /**
         * Button Component Renderer
         */
        button({ label, variant = 'primary', size = 'md', type = 'button', icon = '', extraClass = '', id = '', attributes = {} } = {}) {
            const variantClass = `ui-btn-${variant}`;
            const sizeClass = size !== 'md' ? `ui-btn-${size}` : '';
            const attrStr = Object.entries(attributes).map(([k, v]) => `${k}="${window.escapeHtml(v)}"`).join(' ');
            const idAttr = id ? `id="${id}"` : '';

            return `
                <button type="${type}" ${idAttr} class="ui-btn ${variantClass} ${sizeClass} ${extraClass}" ${attrStr}>
                    ${icon ? `<span class="ui-btn-icon">${icon}</span>` : ''}
                    <span>${window.escapeHtml(label)}</span>
                </button>
            `;
        },

        /**
         * Badge Component Renderer
         */
        badge({ label, variant = 'default', extraClass = '' } = {}) {
            const variantClass = `ui-badge-${variant}`;
            return `<span class="ui-badge ${variantClass} ${extraClass}">${window.escapeHtml(label)}</span>`;
        },

        /**
         * Card Component Renderer
         */
        card({ title, description, content, footer, variant = 'flat', badge = '', extraClass = '', attributes = {} } = {}) {
            const variantClass = `ui-card-${variant}`;
            const attrStr = Object.entries(attributes).map(([k, v]) => `${k}="${window.escapeHtml(v)}"`).join(' ');

            return `
                <div class="ui-card ${variantClass} ${extraClass}" ${attrStr}>
                    ${title || description || badge ? `
                        <div class="ui-card-header">
                            <div class="ui-card-title-wrap">
                                ${title ? `<h3 class="ui-card-title">${window.escapeHtml(title)}</h3>` : ''}
                                ${description ? `<p class="ui-card-description">${window.escapeHtml(description)}</p>` : ''}
                            </div>
                            ${badge ? `<div>${badge}</div>` : ''}
                        </div>
                    ` : ''}
                    <div class="ui-card-content">
                        ${content || ''}
                    </div>
                    ${footer ? `
                        <div class="ui-card-footer">
                            ${footer}
                        </div>
                    ` : ''}
                </div>
            `;
        },

        /**
         * Table Component Renderer
         */
        table({ headers = [], rows = [], emptyMessage = 'No records found.', extraClass = '' } = {}) {
            if (rows.length === 0) {
                return this.stateBlock({
                    type: 'empty',
                    title: 'No Data Available',
                    message: emptyMessage
                });
            }

            const headerHtml = headers.map(h => `<th class="ui-th">${window.escapeHtml(h)}</th>`).join('');
            const rowsHtml = rows.map(row => {
                const cellsHtml = row.map(cell => `<td class="ui-td">${cell}</td>`).join('');
                return `<tr class="ui-tr">${cellsHtml}</tr>`;
            }).join('');

            return `
                <div class="ui-table-container ${extraClass}">
                    <table class="ui-table">
                        <thead>
                            <tr class="ui-tr-head">${headerHtml}</tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
        },

        /**
         * Form Field Component Renderer
         */
        formField({ label, id, type = 'text', value = '', placeholder = '', helpText = '', required = false, extraClass = '', attributes = {} } = {}) {
            const attrStr = Object.entries(attributes).map(([k, v]) => `${k}="${window.escapeHtml(v)}"`).join(' ');
            const reqMark = required ? '<span class="ui-required">*</span>' : '';

            let inputHtml = '';
            if (type === 'textarea') {
                inputHtml = `<textarea id="${id}" name="${id}" class="ui-input ui-textarea" placeholder="${window.escapeHtml(placeholder)}" ${required ? 'required' : ''} ${attrStr}>${window.escapeHtml(value)}</textarea>`;
            } else {
                inputHtml = `<input type="${type}" id="${id}" name="${id}" value="${window.escapeHtml(value)}" class="ui-input" placeholder="${window.escapeHtml(placeholder)}" ${required ? 'required' : ''} ${attrStr} />`;
            }

            return `
                <div class="ui-form-field ${extraClass}">
                    ${label ? `<label for="${id}" class="ui-label">${window.escapeHtml(label)} ${reqMark}</label>` : ''}
                    ${inputHtml}
                    ${helpText ? `<span class="ui-field-help">${window.escapeHtml(helpText)}</span>` : ''}
                </div>
            `;
        },

        /**
         * UX State Block (Loading Skeleton / Empty / Error States)
         */
        stateBlock({ type = 'empty', title = '', message = '', actionLabel = '', onActionClick = '' } = {}) {
            if (type === 'skeleton') {
                return `
                    <div class="ui-state-block ui-state-skeleton">
                        <div class="ui-skeleton-line ui-skeleton-title"></div>
                        <div class="ui-skeleton-line"></div>
                        <div class="ui-skeleton-line" style="width: 75%;"></div>
                    </div>
                `;
            }

            const iconSvg = type === 'error' ? `
                <svg class="ui-state-icon ui-state-icon-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            ` : `
                <svg class="ui-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
            `;

            return `
                <div class="ui-state-block ui-state-${type}">
                    ${iconSvg}
                    ${title ? `<h4 class="ui-state-title">${window.escapeHtml(title)}</h4>` : ''}
                    ${message ? `<p class="ui-state-message">${window.escapeHtml(message)}</p>` : ''}
                    ${actionLabel ? `
                        <div class="ui-state-action">
                            <button type="button" class="ui-btn ui-btn-secondary ui-btn-sm" onclick="${onActionClick}">${window.escapeHtml(actionLabel)}</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    };

    // Attach to window scope
    window.UIComponents = UIComponents;
})();
