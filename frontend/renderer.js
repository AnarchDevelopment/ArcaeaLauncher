document.addEventListener('DOMContentLoaded', () => {
    // ── Splash ─────────────────────────────────────────────
    const splash = document.getElementById('loadingSplash');
    const hideSplash = () => {
        if (splash && !splash.classList.contains('fade-out')) {
            splash.classList.add('fade-out');
            splash.addEventListener('transitionend', () => {
                splash.remove(); // Remove from DOM after fade-out completes
            }, { once: true }); // Ensure this listener runs only once
        }
    };

    // Add a global error handler for better debugging
    window.onerror = function (message, source, lineno, colno, error) {
        console.error("Uncaught JavaScript Error:", { message, source, lineno, colno, error });
        if (window.go && window.go.main && window.go.main.App) {
            window.go.main.App.LogJS(`Uncaught Error: ${message} at ${source}:${lineno}:${colno}`, 'error');
        }
        // Returning true prevents the default browser error handling (e.g., console output, dialogs)
        return true; 
    };

    setTimeout(hideSplash, 2500);


    // ── Element Refs ────────────────────────────────────────
    const btnLaunch          = document.getElementById('btnLaunch');
    const btnCancelLaunch    = document.getElementById('btnCancelLaunch');
    const btnLaunchTitle     = btnLaunch ? btnLaunch.querySelector('.launch-title') : null;
    const btnLaunchSub       = btnLaunch ? btnLaunch.querySelector('.launch-subtitle') : null;
    const btnKill            = document.getElementById('btnKill');
    const btnSettings        = document.getElementById('navSettings');
    const btnMinimize        = document.getElementById('btnMinimize');
    const btnMaximize        = document.getElementById('btnMaximize');
    const btnClose           = document.getElementById('btnClose');
    const settingsModal      = document.getElementById('settingsModal');
    const closeSettings      = document.getElementById('closeSettings');
    const btnBrowse          = document.getElementById('btnBrowse');
    const btnSaveSettings    = document.getElementById('btnSaveSettings');
    const btnSaveSettingsAdv = document.getElementById('btnSaveSettingsAdv');
    const btnResetSettings   = document.getElementById('btnResetSettings');
    const customDllPath      = document.getElementById('customDllPath');
    const versionText        = document.getElementById('versionText');
    const statusDot          = document.getElementById('statusDot');
    const progressContainer  = document.getElementById('progressContainer');
    const progressFill       = document.getElementById('progressFill');
    const progressText       = document.getElementById('progressText');
    const statusMessage      = document.getElementById('statusMessage');
    const playerNameDisplay  = document.getElementById('playerNameDisplay');
    const skinContainer      = document.getElementById('skinContainer');

    // Debug Console
    const consoleModal       = document.getElementById('consoleModal');
    const closeConsole       = document.getElementById('closeConsole');
    const btnOpenConsole     = document.getElementById('btnOpenConsole');
    const btnClearConsole    = document.getElementById('btnClearConsole');
    const consoleLogContainer = document.getElementById('consoleLogContainer');

    // Kill confirm
    const killConfirmModal   = document.getElementById('killConfirmModal');
    const btnConfirmKill     = document.getElementById('btnConfirmKill');
    const btnCancelKill      = document.getElementById('btnCancelKill');
    
    // Auto inject refs
    const autoInjectToggle   = document.getElementById('autoInjectToggle');
    const injectCooldown     = document.getElementById('injectCooldown');
    const autoInjectOptions  = document.getElementById('autoInjectOptions');

    if (autoInjectToggle && autoInjectOptions) {
        autoInjectToggle.addEventListener('change', () => {
            if (autoInjectToggle.checked) autoInjectOptions.classList.add('active');
            else autoInjectOptions.classList.remove('active');
        });
    }

    // Game detected popup
    const gameDetectedModal  = document.getElementById('gameDetectedModal');
    const btnInjectAnyways   = document.getElementById('btnInjectAnyways');
    const btnRestartAndInject = document.getElementById('btnRestartAndInject');
    
    // Manual Inject Warning
    const manualInjectModal  = document.getElementById('manualInjectModal');
    const btnContinueInject  = document.getElementById('btnContinueInject');
    const btnWaitInject      = document.getElementById('btnWaitInject');
    const skipInjectWarning  = document.getElementById('skipInjectWarning');

    // Invalid DLL modal
    const invalidDllModal      = document.getElementById('invalidDllModal');
    const btnDllErrorSettings  = document.getElementById('btnDllErrorSettings');
    const btnDllErrorRetry     = document.getElementById('btnDllErrorRetry');
    
    const newVersionTag      = document.getElementById('newVersionTag');
    
    // Update checker refs
    const btnExpandUpdates   = document.getElementById('btnExpandUpdates');
    const updateCheckerField = document.getElementById('updateCheckerField');
    const checkMaraUpdate    = document.getElementById('checkMaraUpdate');
    const checkDllUpdate     = document.getElementById('checkDllUpdate');
    const languageSelect     = document.getElementById('languageSelect');
    const manageVersionsToggle = document.getElementById('manageVersionsToggle');
    
    // ── State ───────────────────────────────────────────────
    const REQUIRED_VERSION = '0.1510.0.0';
    let isValidVersion = true;
    let isLaunching    = false;
    let isInjected     = false;
    let manualLaunchWaiting = false;
    let launchBlocker = false; // Prevents process watcher from resetting state during startup

    // ── Settings Cache & Backend Integration ──────────────────
    let appSettings = {
        language: 'es',
        custom_dll: '',
        auto_inject: false,
        inject_cooldown: 10,
        check_mara: true,
        check_dll: true,
        skip_inject_warning: false,
        manage_versions: false,
        enable_background: true,
        close_on_inject: false
    };

    async function loadSettingsFromBackend() {
        try {
            if (window.go && window.go.main && window.go.main.App) {
                const cfg = await window.go.main.App.GetConfig();
                if (cfg) {
                    appSettings = cfg;
                    applySettingsToUI();
                }
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }

    async function saveSettingsToBackend() {
        try {
            if (window.go && window.go.main && window.go.main.App) {
                await window.go.main.App.SaveConfig(appSettings);
            }
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    function applySettingsToUI() {
        setLanguage(appSettings.language, false);
        if (customDllPath) customDllPath.value = appSettings.custom_dll || '';
        if (checkMaraUpdate) checkMaraUpdate.checked = appSettings.check_mara;
        if (checkDllUpdate) checkDllUpdate.checked = appSettings.check_dll;
        if (autoInjectToggle) {
            autoInjectToggle.checked = appSettings.auto_inject;
            if (autoInjectToggle.checked && autoInjectOptions) {
                autoInjectOptions.classList.add('active');
            } else if (autoInjectOptions) {
                autoInjectOptions.classList.remove('active');
            }
        }
        if (injectCooldown) injectCooldown.value = appSettings.inject_cooldown;
        if (manageVersionsToggle) {
            manageVersionsToggle.checked = appSettings.manage_versions || false;
        }
        const enableBackgroundToggle = document.getElementById('enableBackgroundToggle');
        if (enableBackgroundToggle) {
            enableBackgroundToggle.checked = appSettings.enable_background;
            const bgVideo = document.querySelector('.bg-image');
            if (bgVideo) {
                if (appSettings.enable_background !== false) {
                    bgVideo.style.display = 'block';
                    bgVideo.play().catch(e => console.log('Video autoplay blocked'));
                } else {
                    bgVideo.style.display = 'none';
                    bgVideo.pause();
                }
            }
        }
        const closeOnInjectToggle = document.getElementById('closeOnInjectToggle');
        if (closeOnInjectToggle) {
            closeOnInjectToggle.checked = appSettings.close_on_inject;
        }
    }

    // ── Internationalization (i18n) ─────────────────────────
    const translations = {
        es: {
            nav_dashboard: "INICIO",
            nav_settings: "AJUSTES",
            welcome_msg: "Bienvenido, ",
            btn_enter: "INYECTAR",
            btn_enter_sub: "",
            btn_manual_launch: "JUGAR",
            btn_manual_launch_sub: "",
            btn_ready_inject: "¿INYECTAR AHORA?",
            btn_ready_inject_sub: "JUEGO DETECTADO",
            btn_kill: "CERRAR",
            btn_kill_sub: "CERRAR MINECRAFT",
            btn_cancel: "CANCELAR",
            settings_title: "Ajustes",
            settings_language: "Idioma",
            settings_auto_inject: "Inyección Automática",
            dll_error_title: "Ruta de DLL inválida",
            dll_error_desc: "¡La ruta de la DLL es inválida! Por favor, selecciona un archivo válido e inténtalo de nuevo.",
            dll_error_settings: "Ajustes",
            dll_error_retry: "Reintentar",
            settings_cooldown: "Tiempo de espera (s)",
            settings_cooldown_warn: "Ajusta este tiempo según la velocidad de carga de tu PC para garantizar estabilidad.",
            settings_payload: "Archivo a Inyectar",
            settings_browse: "Examinar",
            settings_payload_info: "Selecciona una DLL personalizada para inyectar en Minecraft.",
            settings_update_checker: "Comprobador de Actualizaciones",
            settings_check_mara: "Verificar Mara Injector",
            settings_check_dll: "Verificar Aegleseeker DLL",
            settings_update_info: "Activa las actualizaciones automáticas para los componentes clave.",
            settings_save: "Guardar Cambios",
            settings_reset: "Restaurar",
            kill_title: "Cerrar Juego",
            kill_desc: "¿Estás seguro de querer cerrar el proceso del juego? Podrías perder tu progreso no guardado.",
            kill_confirm: "Cerrar Juego",
            kill_cancel: "Cancelar",
            detected_title: "Juego Detectado",
            detected_desc: "Hemos detectado que el juego está abierto y listo para inyectar. Sin embargo, recomendamos iniciar el juego directamente desde el lanzador.",
            detected_restart: "↺ Reiniciar e inyectar",
            detected_recommended: "Recomendado",
            detected_inject_anyways: "Inyectar de todas formas",
            warning_title: "Aviso",
            warning_desc: "Asegúrate de inyectar solo cuando el juego haya cargado completamente en el menú principal. ¿Deseas continuar?",
            warning_wait: "Esperar",
            warning_continue: "Continuar",
            warning_never_show: "No volver a mostrar",
            status_ready: "LISTO",
            status_running: "EN EJECUCIÓN",
            status_injecting: "INYECTANDO...",
            status_injected: "INYECTADO",
            status_ready_launch: "Listo para jugar",
            status_unsupported: "¡Versión no compatible!",
            status_required: "Versión requerida",
            process_error_title: "Error de Proceso",
            process_error_desc: "El proceso de Minecraft se ha cerrado inesperadamente.<br>¿Deseas intentarlo de nuevo?",
            btn_retry: "Reintentar",
            "Launching Minecraft...": "Iniciando Minecraft...",
            "Game opened. Click Inject to load DLL.": "Juego iniciado. Haz clic en Inyectar para cargar la DLL.",
            "Killing existing process...": "Cerrando el proceso actual...",
            "Restarting Minecraft...": "Reiniciando Minecraft...",
            "Relaunching Minecraft...": "Volviendo a abrir Minecraft...",
            "Initializing injection...": "Inicializando inyección...",
            "Preparing injector...": "Preparando inyector...",
            "Preparing Injection...": "Preparando inyección...",
            "Injecting DLL into Minecraft...": "Inyectando DLL en Minecraft...",
            "Injection complete!": "¡Inyección completada!",
            "Injection cancelled": "Inyección cancelada.",
            "Injection cancelled.": "Inyección cancelada.",
            "Minecraft process not found": "Proceso de Minecraft no encontrado.",
            "Focusing game window...": "Enfocando la ventana del juego...",
            "Injection successful!": "¡Inyección exitosa!",
            "settings_behavior": "Comportamiento",
            "settings_enable_bg": "Activar Fondo Animado",
            "settings_close_inject": "Cerrar al inyectar"
        },
        en: {
            nav_dashboard: "DASHBOARD",
            nav_settings: "SETTINGS",
            welcome_msg: "Welcome, ",
            btn_enter: "INJECT",
            btn_enter_sub: "",
            btn_manual_launch: "LAUNCH",
            btn_manual_launch_sub: "",
            btn_ready_inject: "INJECT NOW?",
            btn_ready_inject_sub: "GAME DETECTED",
            btn_kill: "KILL",
            btn_kill_sub: "TERMINATE MINECRAFT",
            btn_cancel: "CANCEL",
            settings_title: "Settings",
            settings_language: "Language",
            dll_error_title: "Invalid DLL Path",
            dll_error_desc: "The selected DLL path is invalid. Please select a valid file and try again.",
            dll_error_settings: "Settings",
            dll_error_retry: "Try Again",
            settings_auto_inject: "Auto Inject",
            settings_cooldown: "Injection Cooldown (s)",
            settings_cooldown_warn: "Adjust this value depending on your PC's loading speed to ensure a stable injection.",
            settings_payload: "Injected Payload",
            settings_browse: "Browse",
            settings_payload_info: "Select a custom DLL to inject into Minecraft.",
            settings_update_checker: "Update Checker",
            settings_check_mara: "Check for Mara Injector updates",
            settings_check_dll: "Check for Aegleseeker DLL updates",
            settings_update_info: "Toggle automatic updates for core components.",
            settings_save: "Save Changes",
            settings_reset: "Reset to Default",
            kill_title: "Terminate Game",
            kill_desc: "Are you sure? Terminating the game process abruptly may cause you to lose unsaved progress.",
            kill_confirm: "Terminate",
            kill_cancel: "Cancel",
            detected_title: "Game Detected",
            detected_desc: "Minecraft is currently running and ready to be injected. However, we highly recommend launching the game directly through the launcher.",
            detected_restart: "↺ Restart and Inject",
            detected_recommended: "Recommended",
            detected_inject_anyways: "Inject Anyways",
            warning_title: "Notice",
            warning_desc: "Please ensure you only inject when the game has fully loaded the main menu. Do you wish to continue?",
            warning_wait: "Wait",
            warning_continue: "Continue",
            warning_never_show: "Don't show this again",
            status_ready: "READY",
            status_running: "RUNNING",
            status_injecting: "INJECTING...",
            status_injected: "INJECTED",
            status_ready_launch: "Ready to launch",
            status_unsupported: "Unsupported version!",
            status_required: "Required version",
            process_error_title: "Process Error",
            process_error_desc: "Minecraft has unexpectedly closed or crashed.<br>Would you like to try again?",
            btn_retry: "Retry",
            "Launching Minecraft...": "Launching Minecraft...",
            "Game opened. Click Inject to load DLL.": "Game opened. Click 'Inject' to load the DLL.",
            "Killing existing process...": "Terminating existing process...",
            "Restarting Minecraft...": "Restarting Minecraft...",
            "Relaunching Minecraft...": "Relaunching Minecraft...",
            "Initializing injection...": "Initializing injection...",
            "Preparing injector...": "Preparing injector...",
            "Preparing Injection...": "Preparing injection...",
            "Injecting DLL into Minecraft...": "Injecting DLL into Minecraft...",
            "Injection complete!": "Injection complete!",
            "Injection cancelled": "Injection cancelled.",
            "Injection cancelled.": "Injection cancelled.",
            "Minecraft process not found": "Minecraft process not found.",
            "Focusing game window...": "Focusing game window...",
            "Injection successful!": "Injection successful!",
            "settings_behavior": "Behavior",
            "settings_enable_bg": "Enable Background Video",
            "settings_close_inject": "Close on Inject"
        },
        pt: {
            nav_dashboard: "INÍCIO",
            nav_settings: "CONFIGURAÇÕES",
            welcome_msg: "Bem-vindo, ",
            btn_enter: "INJETAR",
            btn_enter_sub: "",
            btn_manual_launch: "JOGAR",
            btn_manual_launch_sub: "",
            btn_ready_inject: "INJETAR AGORA?",
            btn_ready_inject_sub: "JOGO DETECTADO",
            btn_kill: "FECHAR",
            btn_kill_sub: "FECHAR MINECRAFT",
            btn_cancel: "CANCELAR",
            settings_title: "Configurações",
            settings_language: "Idioma",
            dll_error_title: "Caminho Inválido",
            dll_error_desc: "O caminho da DLL é inválido! Por favor, selecione um arquivo válido e tente novamente.",
            dll_error_settings: "Configurações",
            dll_error_retry: "Tentar Novamente",
            settings_auto_inject: "Injeção Automática",
            settings_cooldown: "Tempo de espera (s)",
            settings_cooldown_warn: "Ajuste este valor de acordo com a velocidade do seu PC para garantir a estabilidade.",
            settings_payload: "Arquivo a Injetar",
            settings_browse: "Procurar",
            settings_payload_info: "Selecione uma DLL personalizada para injetar no Minecraft.",
            settings_update_checker: "Verificador de Atualizações",
            settings_check_mara: "Verificar atualizações do Mara Injector",
            settings_check_dll: "Verificar atualizações da Aegleseeker DLL",
            settings_update_info: "Alternar atualizações automáticas para os componentes principais.",
            settings_save: "Salvar Alterações",
            settings_reset: "Restaurar Padrões",
            kill_title: "Fechar Jogo",
            kill_desc: "Tem certeza? Encerrar o jogo abruptamente pode causar a perda de progresso não salvo.",
            kill_confirm: "Fechar Jogo",
            kill_cancel: "Cancelar",
            detected_title: "Jogo Detectado",
            detected_desc: "Detectamos que o Minecraft está aberto. No entanto, recomendamos iniciar o jogo diretamente pelo lançador.",
            detected_restart: "↺ Reiniciar e Injetar",
            detected_recommended: "Recomendado",
            detected_inject_anyways: "Injetar mesmo assim",
            warning_title: "Aviso",
            warning_desc: "Certifique-se de injetar apenas quando o jogo estiver totalmente carregado no menu principal. Deseja continuar?",
            warning_wait: "Esperar",
            warning_continue: "Continuar",
            warning_never_show: "Não mostrar novamente",
            status_ready: "PRONTO",
            status_running: "EM EXECUÇÃO",
            status_injecting: "INJETANDO...",
            status_injected: "INJETADO",
            status_ready_launch: "Pronto para jogar",
            status_unsupported: "Versão não suportada!",
            status_required: "Versão necessária",
            process_error_title: "Erro de Processo",
            process_error_desc: "O Minecraft foi fechado inesperadamente.<br>Deseja tentar novamente?",
            btn_retry: "Tentar Novamente",
            "Launching Minecraft...": "Iniciando Minecraft...",
            "Game opened. Click Inject to load DLL.": "Jogo aberto. Clique em Injetar para carregar a DLL.",
            "Killing existing process...": "Encerrando processo existente...",
            "Restarting Minecraft...": "Reiniciando Minecraft...",
            "Relaunching Minecraft...": "Reiniciando Minecraft...",
            "Initializing injection...": "Inicializando injeção...",
            "Preparing injector...": "Preparando injetor...",
            "Preparing Injection...": "Preparando injeção...",
            "Injecting DLL into Minecraft...": "Injetando DLL no Minecraft...",
            "Injection complete!": "Injeção concluída!",
            "Injection cancelled": "Injeção cancelada.",
            "Injection cancelled.": "Injeção cancelada.",
            "Minecraft process not found": "Processo do Minecraft não encontrado.",
            "Focusing game window...": "Focando janela do jogo...",
            "Injection successful!": "Injeção bem-sucedida!",
            "settings_behavior": "Comportamento",
            "settings_enable_bg": "Ativar Vídeo de Fundo",
            "settings_close_inject": "Fechar ao injetar"
        }
    };

    function getTranslation(key) {
        const lang = appSettings.language || 'en';
        const dict = translations[lang] || translations['en'];
        let trans = dict[key] !== undefined ? dict[key] : key;
        
        // Handle dynamic backend messages
        if (key.startsWith("Waiting for ") && key.includes(" seconds before injection...")) {
            const secs = key.replace(/[^0-9]/g, '');
            if (lang === 'es') trans = `Esperando ${secs} segundos antes de la inyección...`;
            else if (lang === 'pt') trans = `Esperando ${secs} segundos antes da injeção...`;
        } else if (key.startsWith("Injecting with Mara:")) {
            const path = key.split("Injecting with Mara: ")[1];
            if (lang === 'es') trans = `Inyectando con Mara: ${path}`;
            else if (lang === 'pt') trans = `Injetando com Mara: ${path}`;
        } else if (key.startsWith("Failed to launch: ")) {
            const err = key.split("Failed to launch: ")[1];
            if (lang === 'es') trans = `Fallo al iniciar: ${err}`;
            else if (lang === 'pt') trans = `Falha ao iniciar: ${err}`;
        }
        
        return trans;
    }

    function updateI18nKey(el, key) {
        if (el) el.textContent = getTranslation(key);
    }

    function setLanguage(lang, shouldSave = true) {
        appSettings.language = lang;
        if (shouldSave) {
            saveSettingsToBackend();
        }
        if (!translations[lang]) lang = 'en';
        const dict = translations[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                if (el.tagName.toLowerCase() === 'p' && dict[key].includes('<')) {
                    el.innerHTML = dict[key];
                } else {
                    el.textContent = dict[key];
                }
            }
        });
        
        const playerNameDisplay = document.getElementById('playerNameDisplay');
        if (playerNameDisplay && playerNameDisplay.dataset.username) {
            const name = playerNameDisplay.dataset.username;
            playerNameDisplay.innerHTML = `<span class="greeting-prefix">${getTranslation('welcome_msg').replace('{username}', '')}</span><span class="player-name-bold">${name}</span>`;
        }
        
        if (isValidVersion) {
            if (isInjected) {
                if (versionText) versionText.textContent = `Minecraft 0.15.10 - ${getTranslation('status_running')}`;
            } else if (isLaunching) {
                // Keep current text
            } else {
                if (versionText) versionText.textContent = `Minecraft 0.15.10 - ${getTranslation('status_ready')}`;
                
                // Fix button texts based on state without resetting UI
                const autoInjectEnabled = autoInjectToggle && autoInjectToggle.checked;
                if (autoInjectEnabled || manualLaunchWaiting) {
                    updateI18nKey(btnLaunchTitle, 'btn_enter');
                    updateI18nKey(btnLaunchSub, 'btn_enter_sub');
                } else {
                    updateI18nKey(btnLaunchTitle, 'btn_manual_launch');
                    updateI18nKey(btnLaunchSub, 'btn_manual_launch_sub');
                }
            }
        }
        
        if (languageSelect) {
            const selectedContent = languageSelect.querySelector('.select-content');
            const itemsList = languageSelect.querySelector('.select-items');
            
            const targetItem = Array.from(itemsList.children).find(el => el.getAttribute('data-value') === lang);
            if (targetItem && selectedContent) {
                selectedContent.innerHTML = targetItem.innerHTML;
            }
        }
        
        // Re-translate current status and progress messages
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage && statusMessage.dataset.currentMsg) {
            statusMessage.textContent = getTranslation(statusMessage.dataset.currentMsg);
        }
        const progressText = document.getElementById('progressText');
        if (progressText && progressText.dataset.currentMsg) {
            progressText.textContent = getTranslation(progressText.dataset.currentMsg);
        }
    }

    setLanguage(appSettings.language, false);

    if (languageSelect) {
        const selected = languageSelect.querySelector('.select-selected');
        const itemsList = languageSelect.querySelector('.select-items');

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            languageSelect.classList.toggle('active');
            itemsList.classList.toggle('select-hide');
        });

        Array.from(itemsList.children).forEach(item => {
            item.addEventListener('click', (e) => {
                const lang = item.getAttribute('data-value');
                setLanguage(lang);
                languageSelect.classList.remove('active');
                itemsList.classList.add('select-hide');
            });
        });

        document.addEventListener('click', () => {
            languageSelect.classList.remove('active');
            itemsList.classList.add('select-hide');
        });
    }

    // Sidebar Navigation page switching logic
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(`page-${pageId}`);
            if (targetPage) targetPage.classList.add('active');
        });
    });

    // Settings Sub-tab switching logic
    document.querySelectorAll('.settings-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-stab');
            document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
            const targetTab = document.getElementById(`stab-${tabId}`);
            if (targetTab) targetTab.classList.add('active');
        });
    });

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
        originalLog(...args);
        const msg = args.join(' ');
        if (window.go && window.go.main && window.go.main.App) {
            window.go.main.App.LogJS(msg, 'info');
        }
    };
    console.warn = (...args) => {
        originalWarn(...args);
        const msg = args.join(' ');
        if (window.go && window.go.main && window.go.main.App) {
            window.go.main.App.LogJS(msg, 'warn');
        }
    };
    console.error = (...args) => {
        originalError(...args);
        const msg = args.join(' ');
        if (window.go && window.go.main && window.go.main.App) {
            window.go.main.App.LogJS(msg, 'error');
        }
    };

    // Listen for backend logs
    window.runtime.EventsOn('app:log', (msg, level = 'system') => {
        showStatus(msg, level);
    });

    btnOpenConsole.addEventListener('click', () => {
        window.go.main.App.OpenConsole();
    });

    function showStatus(message, type = 'info') {
        const statusMessage = document.getElementById('statusMessage');
        if (!statusMessage) return;

        statusMessage.dataset.currentMsg = message;
        statusMessage.textContent = getTranslation(message);
        
        statusMessage.className = `status-message status-${type}`;
        statusMessage.style.opacity = '1';
        
        if (window.statusTimeout) clearTimeout(window.statusTimeout);
        if (type !== 'error' && type !== 'system' && !message.includes("Waiting for")) {
            window.statusTimeout = setTimeout(() => {
                statusMessage.style.opacity = '0';
            }, 3000);
        }
    }

    function updateProgress(percent, text) {
        if (!progressContainer || !progressFill || !progressText) return;
        progressContainer.style.display = 'block';
        progressFill.style.width = `${percent}%`;
        
        progressText.dataset.currentMsg = text;
        progressText.textContent = getTranslation(text);
    }

    function hideProgress() {
        progressContainer.style.display = 'none';
    }

    function setInjectedMode() {
        isInjected = true;
        btnLaunch.style.display = 'none';
        if (btnCancelLaunch) btnCancelLaunch.style.display = 'none';
        btnKill.style.display   = 'flex';
        showStatus('Running!', 'success');
        if (statusDot) statusDot.className = 'status-dot running';
    }

    function setReadyMode() {
        isInjected = false;
        isLaunching = false;
        manualLaunchWaiting = false;
        btnLaunch.style.display = 'flex';
        btnKill.style.display = 'none';
        if (btnCancelLaunch) btnCancelLaunch.style.display = 'none';
        
        const autoInjectEnabled = autoInjectToggle && autoInjectToggle.checked;
        if (autoInjectEnabled) {
            updateI18nKey(btnLaunchTitle, 'btn_enter');
            updateI18nKey(btnLaunchSub, 'btn_enter_sub');
        } else {
            updateI18nKey(btnLaunchTitle, 'btn_manual_launch');
            updateI18nKey(btnLaunchSub, 'btn_manual_launch_sub');
        }
        
        btnLaunch.classList.remove('btn-ready-to-inject');
        btnLaunch.disabled = !isValidVersion;
        if (isValidVersion) {
            showStatus(getTranslation('status_ready_launch'), 'success');
            if (statusDot) statusDot.className = 'status-dot valid';
        }
    }

    async function checkMinecraftVersion() {
        try {
            const version = await window.go.main.App.GetMinecraftVersion();
            if (!version) {
                if (versionText) versionText.textContent = 'Minecraft UWP not found';
                isValidVersion = false;
                btnLaunch.disabled = true;
                showStatus('Minecraft UWP is not installed', 'error');
                return false;
            }
            if (version.includes(REQUIRED_VERSION)) {
                if (versionText) versionText.textContent = `Minecraft 0.15.10 - ${getTranslation('status_ready')}`;
                if (statusDot) statusDot.className = 'status-dot valid';
                isValidVersion = true;
                setReadyMode();
                return true;
            } else {
                if (versionText) versionText.textContent = `Minecraft ${version} - ${getTranslation('status_unsupported')}`;
                if (statusDot) statusDot.className = 'status-dot invalid';
                isValidVersion = false;
                btnLaunch.disabled = true;
                showStatus(`${getTranslation('status_required')}: ${REQUIRED_VERSION}`, 'error');
                return false;
            }
        } catch (e) {
            console.error('Init Error:', e);
            if (versionText) versionText.textContent = 'Minecraft not detected (Bridge Error)';
            if (statusDot) statusDot.className = 'status-dot invalid';
            return false;
        }
    }

    // ── DLL Validation Guard ─────────────────────────────────
    async function validateDLLBeforeLaunch() {
        const dllVal = customDllPath ? customDllPath.value.trim() : '';
        // Empty = use default DLL, always valid
        if (!dllVal) return true;
        try {
            const ok = await window.go.main.App.ValidateDLLPath(dllVal);
            return ok;
        } catch (e) {
            console.error('DLL validation error:', e);
            return false; // fail-safe: block on error
        }
    }

    async function performInject(skipLaunch = false) {
        if (isLaunching && !skipLaunch) return;

        // If we are injecting manually, check if process is still running right away
        if (skipLaunch) {
            const isRunning = await window.go.main.App.IsMinecraftRunning();
            if (!isRunning) {
                openModal(processNotFoundModal);
                return;
            }
        }

        isLaunching = true;
        btnLaunch.style.display = 'none';
        if (btnCancelLaunch) btnCancelLaunch.style.display = 'flex';

        if (!skipLaunch) {
            launchBlocker = true;
            setTimeout(() => { launchBlocker = false; }, 10000);
        }

        try {
            updateProgress(40, 'Preparing Injection...');
            showStatus('Injecting DLL into Minecraft...', 'info');

            const dllValue = customDllPath ? customDllPath.value.trim() : '';
            const cooldownVal = parseInt(injectCooldown.value) || 10;
            
            const result = await window.go.main.App.PerformInjection(
                dllValue, 
                skipLaunch, 
                checkMaraUpdate.checked, 
                checkDllUpdate.checked,
                cooldownVal
            );

            if (result.success) {
                updateProgress(100, 'Injection complete!');
                await new Promise(resolve => setTimeout(resolve, 1500));
                hideProgress();
                setInjectedMode();
                window.go.main.App.SetRPCIngame();
                if (appSettings.close_on_inject) {
                    window.runtime.Quit();
                }
            } else {
                if (result.error === 'cancelled') {
                    showStatus('Injection cancelled', 'info');
                    setReadyMode();
                } else if (result.error === 'process_not_found') {
                    showStatus('Minecraft process not found', 'error');
                    setReadyMode();
                    openModal(processNotFoundModal);
                } else {
                    throw new Error(result.error || 'Injection failed');
                }
            }
        } catch (error) {
            showStatus(`Error: ${error.message}`, 'error');
            hideProgress();
            setReadyMode();
        } finally {
            isLaunching = false;
        }
    }

    if (btnCancelLaunch) {
        btnCancelLaunch.addEventListener('click', () => {
            window.go.main.App.CancelInjection();
        });
    }

    btnLaunch.addEventListener('click', async () => {
        if (isLaunching) return;

        // Manual Injection Confirmation
        if (manualLaunchWaiting) {
            const skip = appSettings.skip_inject_warning === true;
            if (skip) {
                manualLaunchWaiting = false;
                // Validate DLL even in this path
                if (!await validateDLLBeforeLaunch()) { openModal(invalidDllModal); return; }
                await performInject(true);
            } else {
                openModal(manualInjectModal);
            }
            return;
        }

        // Validate DLL before any launch flow
        if (!await validateDLLBeforeLaunch()) {
            openModal(invalidDllModal);
            return;
        }

        const autoInjectEnabled = autoInjectToggle && autoInjectToggle.checked;
        
        if (autoInjectEnabled) {
            // Auto-Inject Flow: Launch -> Wait Cooldown -> Inject
            await performInject(false);
        } else {
            // Manual Flow: Launch -> Change to Inject
            isLaunching = true;
            btnLaunch.style.display = 'none';
            if (btnCancelLaunch) btnCancelLaunch.style.display = 'flex';
            updateProgress(30, 'Launching Minecraft...');
            showStatus('Launching Minecraft...', 'info');

            try {
                const res = await window.go.main.App.LaunchMinecraft();
                if (!res.success) throw new Error(res.error);

                launchBlocker = true;
                updateProgress(60, 'Game starting...');
                
                isLaunching = false;
                manualLaunchWaiting = true;
                if (btnCancelLaunch) btnCancelLaunch.style.display = 'none';
                btnLaunch.style.display = 'flex';
                btnLaunch.classList.add('btn-ready-to-inject');
                
                updateI18nKey(btnLaunchTitle, 'btn_enter');
                updateI18nKey(btnLaunchSub, 'btn_enter_sub');
                
                showStatus('Game opened. Click Inject to load DLL.', 'success');
                hideProgress();
                
                // Keep blocker active for a bit longer to ensure it doesn't flip back
                setTimeout(() => { launchBlocker = false; }, 5000);
            } catch (e) {
                showStatus(`Failed to launch: ${e.message}`, 'error');
                setReadyMode();
            }
        }
    });

    btnContinueInject.addEventListener('click', async () => {
        if (skipInjectWarning && skipInjectWarning.checked) {
            appSettings.skip_inject_warning = true;
            saveSettingsToBackend();
        }
        closeModal(manualInjectModal);
        manualLaunchWaiting = false;
        await performInject(true);
    });

    btnWaitInject.addEventListener('click', () => closeModal(manualInjectModal));

    // ── Process Not Found Modal ───────────────────────────────
    const processNotFoundModal = document.getElementById('processNotFoundModal');
    const btnRetryInject = document.getElementById('btnRetryInject');
    const btnCancelRetry = document.getElementById('btnCancelRetry');

    btnRetryInject.addEventListener('click', async () => {
        closeModal(processNotFoundModal);
        // We simulate a manual click on "Launch" so it restarts the whole flow if needed
        // Or we can just call performInject(false) to restart the game
        const autoInjectEnabled = autoInjectToggle && autoInjectToggle.checked;
        if (autoInjectEnabled) {
            await performInject(false);
        } else {
            // For manual mode, reset UI to ready and let them click Launch again
            setReadyMode();
            btnLaunch.click();
        }
    });

    btnCancelRetry.addEventListener('click', () => {
        closeModal(processNotFoundModal);
        setReadyMode();
    });

    // ── Kill Button ──────────────────────────────────────────
    btnKill.addEventListener('click', () => {
        openModal(killConfirmModal);
    });

    btnConfirmKill.addEventListener('click', async () => {
        closeModal(killConfirmModal);
        const result = await window.go.main.App.KillMinecraft();
        if (!result.success) {
            showStatus('Failed to kill Minecraft: ' + result.error, 'error');
        }
        // setReadyMode will be called naturally by the process watcher event
    });

    btnCancelKill.addEventListener('click', () => closeModal(killConfirmModal));

    // ── Game-Detected Popup ──────────────────────────────────
    btnInjectAnyways.addEventListener('click', async () => {
        closeModal(gameDetectedModal);
        await performInject(true /* skipLaunch */);
    });

    btnRestartAndInject.addEventListener('click', async () => {
        closeModal(gameDetectedModal);
        if (isLaunching) return;
        isLaunching = true;
        btnLaunch.disabled = true;

        try {
            updateProgress(20, 'Killing existing process...');
            showStatus('Restarting Minecraft...', 'info');
            await window.go.main.App.KillMinecraft();
            await new Promise(resolve => setTimeout(resolve, 1500));
            updateProgress(50, 'Relaunching Minecraft...');
            isLaunching = false;
            await performInject(false /* launch fresh */);
        } catch (e) {
            showStatus(`Error: ${e.message}`, 'error');
            hideProgress();
            isLaunching = false;
            btnLaunch.disabled = !isValidVersion;
        }
    });

    // ── Process Watcher (events from Go) ─────────────────────
    // Go emits "minecraft:running" every second
    window.runtime.EventsOn('minecraft:running', (running) => {
        if (running) {
            if (!isInjected && !isLaunching) {
                // Check for Auto-Inject
                const autoInjectEnabled = autoInjectToggle && autoInjectToggle.checked;
                if (autoInjectEnabled) {
                    console.log("Auto-Inject: Game detected, starting injection...");
                    validateDLLBeforeLaunch().then(ok => {
                        if (!ok) { openModal(invalidDllModal); return; }
                        performInject(true /* skipLaunch since it's already running */);
                    });
                }
            }
        } else {
            // Process gone
            if (!launchBlocker && (isInjected || isLaunching || manualLaunchWaiting)) {
                setReadyMode();
                isLaunching = false;
                hideProgress();
                window.go.main.App.SetRPCLauncher();
            }
        }
    });

    // ── Update Logic ─────────────────────────────────────────
    let latestUpdateUrl = '';

    window.runtime.EventsOn('update:available', (data) => {
        let version = '0.0.0';
        if (typeof data === 'object' && data !== null) {
            version = data.version;
            latestUpdateUrl = data.url;
        } else {
            version = data;
        }
        if (newVersionTag) newVersionTag.textContent = `v${version}`;
        openModal(updateModal);
    });

    if (btnUpdateNow) {
        btnUpdateNow.addEventListener('click', () => {
            closeModal(updateModal);
            showStatus('Launching updater...', 'info');
            
            const lang = appSettings.language || 'es';
            
            window.go.main.App.StartUpdate(latestUpdateUrl, lang)
                .then((res) => {
                    if (res && !res.success) {
                        showStatus('Failed to start update: ' + res.error, 'error');
                    }
                })
                .catch((err) => {
                    showStatus('Error starting updater: ' + err, 'error');
                });
        });
    }

    if (btnUpdateLater) {
        btnUpdateLater.addEventListener('click', () => {
            closeModal(updateModal);
        });
    }

    // ── Modal Helpers ────────────────────────────────────────
    function openModal(el) { el.classList.add('active'); }
    function closeModal(el) { el.classList.remove('active'); }

    // ── Invalid DLL Modal Buttons ────────────────────────────
    if (btnDllErrorSettings) {
        btnDllErrorSettings.addEventListener('click', () => {
            closeModal(invalidDllModal);
            openSettings();
        });
    }
    if (btnDllErrorRetry) {
        btnDllErrorRetry.addEventListener('click', async () => {
            closeModal(invalidDllModal);
            // Re-validate; if now OK, resume the launch
            if (await validateDLLBeforeLaunch()) {
                btnLaunch.click();
            } else {
                openModal(invalidDllModal);
            }
        });
    }

    // Settings
    function openSettings() {
        document.querySelectorAll('.sidebar-nav-item').forEach(b => {
            if (b.getAttribute('data-page') === 'settings') {
                b.click();
            }
        });
    }
    function closeSettingsModal() { /* Modal is now a page, no-op */ }

    // Expansion logic
    if (btnExpandUpdates) {
        btnExpandUpdates.addEventListener('click', () => {
            updateCheckerField.classList.toggle('field--open');
        });
    }

    // ── Window Controls ──────────────────────────────────────
    if (btnMinimize) btnMinimize.addEventListener('click', () => window.runtime.WindowMinimize());
    if (btnMaximize) btnMaximize.addEventListener('click', () => {
        window.runtime.WindowIsMaximised().then(isMax => {
            if (isMax) window.runtime.WindowUnmaximise();
            else window.runtime.WindowMaximise();
        });
    });
    if (btnClose) btnClose.addEventListener('click', () => window.runtime.Quit());

    // ── Settings Persistence ─────────────────────────────────
    if (btnBrowse) {
        btnBrowse.addEventListener('click', async () => {
            try {
                const fp = await window.go.main.App.SelectDLL();
                if (fp) customDllPath.value = fp;
            } catch (e) {
                console.error('Failed to select DLL:', e);
            }
        });
    }

    function saveAllSettings() {
        appSettings.custom_dll = customDllPath.value.trim();
        appSettings.check_mara = checkMaraUpdate.checked;
        appSettings.check_dll = checkDllUpdate.checked;
        appSettings.auto_inject = autoInjectToggle.checked;
        appSettings.inject_cooldown = parseInt(injectCooldown.value) || 10;
        if (manageVersionsToggle) {
            appSettings.manage_versions = manageVersionsToggle.checked;
        }
        const enableBackgroundToggle = document.getElementById('enableBackgroundToggle');
        if (enableBackgroundToggle) {
            appSettings.enable_background = enableBackgroundToggle.checked;
        }
        const closeOnInjectToggle = document.getElementById('closeOnInjectToggle');
        if (closeOnInjectToggle) {
            appSettings.close_on_inject = closeOnInjectToggle.checked;
        }
        
        applySettingsToUI();
        saveSettingsToBackend();
        showStatus('Settings saved!', 'success');
    }

    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', saveAllSettings);
    }
    if (btnSaveSettingsAdv) {
        btnSaveSettingsAdv.addEventListener('click', saveAllSettings);
    }

    if (btnResetSettings) {
        btnResetSettings.addEventListener('click', () => {
            customDllPath.value = '';
            checkMaraUpdate.checked = true;
            checkDllUpdate.checked = true;
            autoInjectToggle.checked = false;
            injectCooldown.value = 10;
            if (manageVersionsToggle) {
                manageVersionsToggle.checked = false;
            }
            const enableBackgroundToggle = document.getElementById('enableBackgroundToggle');
            if (enableBackgroundToggle) enableBackgroundToggle.checked = true;
            const closeOnInjectToggle = document.getElementById('closeOnInjectToggle');
            if (closeOnInjectToggle) closeOnInjectToggle.checked = false;
            
            appSettings.custom_dll = '';
            appSettings.check_mara = true;
            appSettings.check_dll = true;
            appSettings.auto_inject = false;
            appSettings.inject_cooldown = 10;
            appSettings.manage_versions = false;
            appSettings.enable_background = true;
            appSettings.close_on_inject = false;
            appSettings.manage_versions = false;
            
            saveSettingsToBackend();
            showStatus('Settings reset to default!', 'success');
        });
    }

    // ── Cinematic Flicker ────────────────────────────────────
    setInterval(() => {
        if (Math.random() > 0.96) {
            document.body.classList.add('flicker');
            setTimeout(() => document.body.classList.remove('flicker'), 120);
        }
    }, 2000);

    // ── Skin Viewer & Boot ───────────────────────────────────
    async function initSkinViewer() {
        if (!window.skinview3d || !skinContainer) return;
        
        let viewer;
        try {
            viewer = new skinview3d.SkinViewer({
                canvas: document.createElement("canvas"),
                width: skinContainer.clientWidth || 300,
                height: skinContainer.clientHeight || 400
            });
        } catch (err) {
            console.error("initSkinViewer: CRASHED during constructor:", err);
            return;
        }
        
        skinContainer.innerHTML = ''; 
        try {
            skinContainer.appendChild(viewer.canvas);
            if (viewer.camera) viewer.camera.position.z = 60;
            
            // Brighten up the character
            if (viewer.globalLight) viewer.globalLight.intensity = 0.7;
            if (viewer.cameraLight) viewer.cameraLight.intensity = 0.7;
            
            const animObj = viewer.animations || viewer.animation;
            if (animObj && animObj.add && skinview3d.IdleAnimation) {
                animObj.add(skinview3d.IdleAnimation);
            }
        } catch (e) {
            console.error("initSkinViewer: Error during setup:", e);
        }

        // Fetch custom skin from backend IMMEDIATELY
        try {
            if (!window.go || !window.go.main || !window.go.main.App) {
                console.error("initSkinViewer: Wails API not ready, falling back to default.");
                await viewer.loadSkin("fallback-skin.png");
                return;
            }
            
            const base64Skin = await window.go.main.App.GetMinecraftSkinBase64();
            if (base64Skin && base64Skin.length > 200) {
                await viewer.loadSkin(base64Skin);
            } else {
                console.log("initSkinViewer: Custom skin not found, using fallback.");
                await viewer.loadSkin("fallback-skin.png");
            }
        } catch(e) {
            console.error("initSkinViewer: Error loading skin, using fallback:", e);
            await viewer.loadSkin("fallback-skin.png");
        }

        // Handle resize
        window.addEventListener('resize', () => {
            if (viewer) {
                viewer.width = skinContainer.clientWidth;
                viewer.height = skinContainer.clientHeight;
            }
        });
    }

    async function boot() {
        // Load settings from backend before initializing other views
        await loadSettingsFromBackend();

        try {
            const ver = await window.go.main.App.GetAppVersion();
            // Optional: put version somewhere
        } catch (e) {
            console.error('Failed to get app version:', e);
        }

        try {
            const username = await window.go.main.App.GetMinecraftUsername();
            if (username && playerNameDisplay) {
                playerNameDisplay.dataset.username = username;
                playerNameDisplay.innerHTML = `<span class="greeting-prefix">${getTranslation('welcome_msg').replace('{username}', '')}</span><span class="player-name-bold">${username}</span>`;
                const topUserName = document.querySelector('.user-name');
                if (topUserName) topUserName.textContent = username;
            }
        } catch(e) {
            console.error('Failed to get username:', e);
        }

        initSkinViewer();
        setTimeout(checkMinecraftVersion, 500);
    }

    boot();
});
