/**
 * DiginixIT UI Primitives (Base UI Pattern)
 * Behavior-only primitives for Dialogs, Dropdowns, Tabs, Tooltips, Inputs, and Buttons.
 * Enforces accessibility (ARIA) and data-state contracts ("open" | "closed" | "active").
 */

(function () {
    'use strict';

    const UIPrimitives = {
        /**
         * Dialog Primitive (Modals / Overlays)
         */
        Dialog: {
            open(dialogEl) {
                if (!dialogEl) return;
                dialogEl.setAttribute('data-state', 'open');
                dialogEl.classList.remove('hidden');
                dialogEl.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';

                // Focus first focusable element inside dialog
                const focusable = dialogEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length > 0) {
                    focusable[0].focus();
                }

                // Bind ESC key listener
                dialogEl._escHandler = function (e) {
                    if (e.key === 'Escape') {
                        UIPrimitives.Dialog.close(dialogEl);
                    }
                };
                document.addEventListener('keydown', dialogEl._escHandler);
            },
            close(dialogEl) {
                if (!dialogEl) return;
                dialogEl.setAttribute('data-state', 'closed');
                dialogEl.setAttribute('aria-hidden', 'true');
                dialogEl.classList.add('hidden');
                document.body.style.overflow = '';

                if (dialogEl._escHandler) {
                    document.removeEventListener('keydown', dialogEl._escHandler);
                    delete dialogEl._escHandler;
                }
            },
            toggle(dialogEl) {
                const isOpen = dialogEl.getAttribute('data-state') === 'open';
                if (isOpen) {
                    this.close(dialogEl);
                } else {
                    this.open(dialogEl);
                }
            }
        },

        /**
         * Dropdown & Popover Primitive
         */
        Dropdown: {
            open(menuEl, triggerEl) {
                if (!menuEl) return;
                menuEl.setAttribute('data-state', 'open');
                menuEl.classList.remove('hidden');
                if (triggerEl) triggerEl.setAttribute('aria-expanded', 'true');

                // Outside click handler
                menuEl._outsideHandler = function (e) {
                    if (!menuEl.contains(e.target) && (!triggerEl || !triggerEl.contains(e.target))) {
                        UIPrimitives.Dropdown.close(menuEl, triggerEl);
                    }
                };
                setTimeout(() => document.addEventListener('click', menuEl._outsideHandler), 0);
            },
            close(menuEl, triggerEl) {
                if (!menuEl) return;
                menuEl.setAttribute('data-state', 'closed');
                menuEl.classList.add('hidden');
                if (triggerEl) triggerEl.setAttribute('aria-expanded', 'false');

                if (menuEl._outsideHandler) {
                    document.removeEventListener('click', menuEl._outsideHandler);
                    delete menuEl._outsideHandler;
                }
            },
            toggle(menuEl, triggerEl) {
                const isOpen = menuEl.getAttribute('data-state') === 'open';
                if (isOpen) {
                    this.close(menuEl, triggerEl);
                } else {
                    this.open(menuEl, triggerEl);
                }
            }
        },

        /**
         * Tabs System Primitive
         */
        Tabs: {
            select(containerEl, tabId) {
                if (!containerEl) return;

                const triggers = containerEl.querySelectorAll('[data-ui-tab-trigger]');
                const panels = containerEl.querySelectorAll('[data-ui-tab-panel]');

                triggers.forEach(trigger => {
                    const target = trigger.getAttribute('data-ui-tab-trigger');
                    const isActive = target === tabId;
                    trigger.setAttribute('data-state', isActive ? 'active' : 'inactive');
                    trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });

                panels.forEach(panel => {
                    const panelId = panel.getAttribute('data-ui-tab-panel');
                    const isActive = panelId === tabId;
                    panel.setAttribute('data-state', isActive ? 'active' : 'inactive');
                    if (isActive) {
                        panel.classList.remove('hidden');
                    } else {
                        panel.classList.add('hidden');
                    }
                });
            }
        },

        /**
         * Button State Primitive (Loading / Disabled)
         */
        ButtonState: {
            setLoading(btnEl, isLoading, customText) {
                if (!btnEl) return;

                if (isLoading) {
                    btnEl.setAttribute('data-loading', 'true');
                    btnEl.setAttribute('disabled', 'true');
                    btnEl._originalHTML = btnEl.innerHTML;
                    const spinnerText = customText || btnEl.textContent.trim();

                    btnEl.innerHTML = `
                        <svg class="ui-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;animation:ui-spin 0.75s linear infinite;">
                            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                            <path d="M12 2 a10 10 0 0 1 10 10" stroke-opacity="1"></path>
                        </svg>
                        <span>${spinnerText}</span>
                    `;
                } else {
                    btnEl.removeAttribute('data-loading');
                    btnEl.removeAttribute('disabled');
                    if (btnEl._originalHTML !== undefined) {
                        btnEl.innerHTML = btnEl._originalHTML;
                        delete btnEl._originalHTML;
                    }
                }
            }
        },

        /**
         * Input Focus & Validation Primitive
         */
        InputFocus: {
            setInvalid(inputEl, isInvalid, message = '') {
                if (!inputEl) return;
                inputEl.setAttribute('data-invalid', isInvalid ? 'true' : 'false');
                inputEl.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');

                const wrapper = inputEl.closest('.ui-form-field');
                if (wrapper) {
                    let errEl = wrapper.querySelector('.ui-field-error');
                    if (isInvalid) {
                        if (!errEl) {
                            errEl = document.createElement('span');
                            errEl.className = 'ui-field-error';
                            wrapper.appendChild(errEl);
                        }
                        errEl.textContent = message;
                    } else if (errEl) {
                        errEl.remove();
                    }
                }
            }
        },

        /**
         * Auto-binding declarative attributes
         */
        initAutoBind() {
            // Bind Tab Triggers
            document.querySelectorAll('[data-ui-tab-trigger]').forEach(trigger => {
                if (trigger._hasUiTabBound) return;
                trigger._hasUiTabBound = true;
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    const container = trigger.closest('[data-ui-tabs]');
                    const tabId = trigger.getAttribute('data-ui-tab-trigger');
                    if (container && tabId) {
                        UIPrimitives.Tabs.select(container, tabId);
                    }
                });
            });

            // Bind Dialog Triggers
            document.querySelectorAll('[data-ui-dialog-target]').forEach(trigger => {
                if (trigger._hasUiDialogBound) return;
                trigger._hasUiDialogBound = true;
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = trigger.getAttribute('data-ui-dialog-target');
                    const dialogEl = document.getElementById(targetId);
                    if (dialogEl) {
                        UIPrimitives.Dialog.open(dialogEl);
                    }
                });
            });

            // Bind Dialog Close Buttons
            document.querySelectorAll('[data-ui-dialog-close]').forEach(btn => {
                if (btn._hasUiCloseBound) return;
                btn._hasUiCloseBound = true;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const dialogEl = btn.closest('[data-ui-dialog]');
                    if (dialogEl) {
                        UIPrimitives.Dialog.close(dialogEl);
                    }
                });
            });
        }
    };

    // Attach to window scope
    window.UIPrimitives = UIPrimitives;

    // Run auto-binding when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UIPrimitives.initAutoBind());
    } else {
        UIPrimitives.initAutoBind();
    }
})();
