/*
Smart Render - Floating
After Effects 2026 / Windows
Parallel PNG, fast H.264, native PNG, or resumable sequence render via aerender.exe.

IMPORTANT:
- This is intentionally a FLOATING ScriptUI palette, not a dockable Panel.
- Put it in After Effects\Support Files\Scripts\ (not ScriptUI Panels) if you want it in File > Scripts.
- MP4 creation requires FFmpeg; audio is rendered from the selected comp and frame range.
- UI startup performs no PowerShell or external-process calls.
- v1.0 adds Draft/Final quality profiles and fast 33/50/100% AE render resolution.
- v1.1 makes Delete Work Area invalidate that time range across ALL Draft/Final cache profiles for the active comp.
- v1.2 tracks only frames missing at job start and never reports 100% until render completion is verified.
- v1.3 hardens PNG-to-MP4 encoding with exact frame count, even-dimension padding, temp-file validation, and explicit encode-state flags.
- v1.4 simplifies output to one selected folder: folder name becomes the filename template, PNGs stay inside it, and MP4 is written to its parent folder.
- v1.5 auto-detects Shutter Encoder's bundled FFmpeg before falling back to Windows PATH.
- v1.6 makes progress UI-session-only and tracks PNGs touched by the current run.
- v1.7 runs aerender directly inside the hidden batch (no START).
- v1.8 handles AE 2026 cases where aerender returns before its worker is finished: every requested PNG must exist, be non-empty, and become stable before FFmpeg starts.
- v1.9 makes the primary render action full-width and self-describing, uses a real folder-only chooser, and remembers the last selected output folder globally as well as per comp.
- v2.0 renders the comp's mixed audio to WAV in a second verified background pass and muxes it into the H.264 MP4 as AAC audio.
- v2.1 uses non-Multi-Machine render settings for the WAV pass and validates an Output Module template's real format instead of trusting a template named "WAV".
- v2.2 reports progress across the entire frame range, hardens scheduled UI polling, and restores the modern Explorer-style folder browser with a clear non-created placeholder.
- v2.3 adds optional non-destructive MP4 filename increments and replaces the crowded action label with a readable three-line render summary.
- v2.4 shows the active background job with elapsed time and rolling frame ETA, records the job's process ID, and adds a confirmed END ACTIVE RENDER action scoped to that job's process tree.
- v2.5 writes per-job recovery metadata and adds SCAN ACTIVE RENDER to reconnect the UI, frame bar, stage, ETA, log, and End control after the palette is closed and reopened.
- v2.6 detects a stalled PNG sequence after 10 minutes without progress, removes incomplete zero-byte frames, and automatically resumes through Skip Existing Files up to three times.
- v2.7 compacts the palette, moves the render summary into the primary button, adds a persistent CRF quality slider, and uses a real PNG sequence filename picker that can resume existing sequences.
- v2.8 uses a clean one-line render action, labels the CRF direction, and replaces bright native cache prompts with compact theme-aware ScriptUI dialogs.
- v2.9 decodes ExtendScript URI-encoded filenames before progress and cache matching, so sequence names containing spaces update correctly.
- v3.0 merges render/output settings, removes the Job panel, and moves time plus render utilities into a compact two-line footer.
- v3.1 labels the render-size control as Resolution and turns the progress line green only after the complete PNG/audio/MP4 job succeeds.
- v3.2 adds a persistent Alpha checkbox that selects _png_alpha_frame or _png_sequence and isolates RGB-only cache frames.
- v3.3 removes cursor-jolting per-second PNG folder scans by reading a tiny background progress counter, with a throttled fallback for older jobs.
- v3.4 makes Increment MP4 always use numbered delivery versions starting at .1, then .2, .3, and so on.
- v4.0 adds Fast MP4, Resumable JPEG, and Lossless PNG modes; prevents concurrent Smart Render jobs; tracks detached AfterFX.com worker PIDs; and makes End Render terminate the real render workers.
- v4.1 opens an independent visible terminal for every render, showing stage, frames, speed, elapsed time, ETA, output, and final status even after After Effects closes.
- v4.2 adds a Fast PNG path based on normal Best Settings so fresh lossless sequences can use Multi-Frame Rendering; resumable PNG remains available for missing-frame recovery.
- v4.3 tracks rewritten Fast PNG frames separately from pre-existing cache files, so progress and ETA start immediately when a full sequence is overwritten.
- v5.0 adds a default Parallel PNG pipeline: AE renders temporary local TIFF chunks, FFmpeg converts them to lossless PNG with frame threads, and verified TIFF chunks are removed immediately.
- v5.1 separates primary Render choices from secondary Options, adds an always-visible settings summary, and simplifies the utility/progress area.
- v5.2 removes tabs and keeps every setting visible in aligned Composition and Output sections.
- v5.3 simplifies the primary action label to the composition name only.
- v5.4 adds an explicit Refresh button that retargets Smart Render to the currently active Timeline composition.
- v5.5 makes Parallel PNG resumable by rendering only contiguous missing-frame segments, then verifies and encodes the complete cached sequence.
- v5.6 maps AE's segment-local TIFF numbering back to absolute composition frame numbers, preventing converters from stalling after resumed ranges.
- v5.7 shows approximate absolute frame and missing-frame remainder during rendering, then replaces frame speed/ETA with audio and MP4 encoding status.
- v5.8 treats FFmpeg stderr as non-fatal when exit code is zero, verifies every PNG batch, and retries real conversion failures up to three times.
- v5.9 removes FFmpeg's retired -vsync option from TIFF-to-PNG conversion; numbered still-image batches remain one-to-one and are verified frame by frame.
- v5.10 terminates tracked AE workers when Parallel PNG conversion fails or is cancelled, preventing a failed job from continuing invisibly.
- Smart Render v1 adds an "Auto-follow active comp" toggle: every comp remembers the output folder it was last rendered to or last chose, and switching the active Timeline composition retargets the File path to that comp's folder automatically. Auto-follow and Refresh stay strictly comp-specific: a comp with no folder of its own gets one derived next to the sibling comps (<container>\<CompName>\<CompName>_.png) instead of borrowing the previous comp's path, and a folder saved against the wrong comp in an earlier build is detected and replaced.
- Smart Render v1 adds a Batch queue (its own window, "Show batch queue"): one checkbox row per comp with a per-row Folder and remove button, "Render checked" renders them one after another (the next starts only when the previous finishes) with an optional "Stop on error". The working queue is retained between sessions and any number of named lists can be saved/loaded/deleted, all in smartrender-batch.json in the project folder (a fixed name, so incrementing the .aep keeps every list; an older <aepname>.smartrender-batch.json is migrated once).
- Smart Render v1 writes the MP4 into the same folder as the frame sequence (the folder actually selected), instead of one level up when the folder name matched the sequence name.
- Smart Render v1: picking an existing delivered .mp4 in Choose resolves to the frame sequence already cached in that folder (so those PNGs are reused, not re-rendered).
- Smart Render v1 simplifies naming: the sequence/output name is always the comp name ("1.3.2 Activations & Checks" -> "1.3.2 Activations & Checks_.png"), no exceptions; only the folder is remembered per comp. Increment MP4 now appends "_1", "_2", "_3" ("1.3.2 Activations & Checks_1.mp4") instead of ".1", ".2". To resume an older differently-named sequence, use Choose and pick its existing .mp4.
- Smart Render v1 adds a "Fix Names" button (next to RENDER): renames the frame sequence and MP4 already in the output folder to the current naming style. If the folder holds more than one sequence or MP4, a dialog lists them, lets you pick which to keep, and can delete the rest.
*/

(function SmartRenderFloating() {

    var SCRIPT_NAME = "Smart Render";
    var VERSION = "1";
    var UI_POLL_MS = 2000;
    var FULL_SCAN_FALLBACK_MS = 10000;

    // ---------- helpers ----------

    function isWindows() {
        return $.os.toLowerCase().indexOf("windows") !== -1;
    }

    function q(s) {
        // Quote a Windows command-line argument.
        s = String(s);
        return '"' + s.replace(/"/g, '\\"') + '"';
    }

    function pad2(n) {
        n = String(n);
        return n.length < 2 ? "0" + n : n;
    }

    function timestamp() {
        var d = new Date();
        return d.getFullYear() +
            pad2(d.getMonth() + 1) +
            pad2(d.getDate()) + "_" +
            pad2(d.getHours()) +
            pad2(d.getMinutes()) +
            pad2(d.getSeconds());
    }

    function safeName(name) {
        var s = String(name);
        s = s.replace(/[\\\/:\*\?"<>\|]/g, "_");
        s = s.replace(/^\s+|\s+$/g, "");
        if (!s.length) s = "Comp";
        return s;
    }

    function getActiveComp() {
        var item = app.project.activeItem;
        if (item && item instanceof CompItem) return item;
        return null;
    }

    function defaultOutputFolder(comp) {
        // IMPORTANT: no disk writes here.
        // This function runs while the UI opens, so it only builds a path.
        // The folder is created later, only when the user starts a render.
        if (!app.project.file) return Folder.desktop;

        var root = app.project.file.parent;
        return new Folder(
            root.fsName + "\\Renders\\" + safeName(comp.name)
        );
    }

    function getFolderName(folder) {
        var name = "";

        try {
            name = folder.name;
            try {
                name = decodeURI(name);
            } catch (decodeErr) {}
        } catch (e) {}

        if (!name || !String(name).length) {
            name = "Render";
        }

        return safeName(name);
    }

    function sequenceBaseFromFileName(fileName) {
        var name = String(fileName || "");

        try {
            name = decodeURI(name);
        } catch (decodeErr) {}

        name = name.replace(/\.(?:png|jpe?g|mp4)$/i, "");
        name = name.replace(/_\[?#+\]?$/i, "");
        name = name.replace(/_-?\d+$/i, "");
        name = name.replace(/_+$/g, "");
        name = name.replace(/_(RGB|ALPHA|JPG)$/i, "");
        name = name.replace(/_(DRAFT|FINAL)_(33|50|100)$/i, "");

        return safeName(name || "Render");
    }

    function makeOutputTemplate(folder, baseName) {
        return new File(
            folder.fsName + "\\" + safeName(baseName) + "_.png"
        );
    }

    function outputTemplateFromFolder(folder) {
        return makeOutputTemplate(folder, getFolderName(folder));
    }

    function parseOutputSelection(path, comp) {
        var text = String(path || "");
        var file = null;
        var folder = null;
        var baseName = "";

        if (/\.png$/i.test(text)) {
            file = new File(text);
            folder = file.parent;
            baseName = sequenceBaseFromFileName(file.name);
        } else if (text.length) {
            // Compatibility with v2.6 and older saved folder-only paths.
            folder = new Folder(text);
            baseName = getFolderName(folder);
        } else {
            folder = defaultOutputFolder(comp);
            baseName = comp ? safeName(comp.name) : getFolderName(folder);
        }

        return {
            folder: folder,
            baseName: baseName,
            templateFile: makeOutputTemplate(folder, baseName)
        };
    }

    function getMovieFolderForOutput(folder, baseName, directMovie) {
        // The MP4 is written into the same folder as the frame sequence - the
        // folder the user actually picked. (Builds before Smart Render v1 moved
        // it one level up when the folder name matched the sequence name, which
        // made the movie hard to find in the per-comp batch workflow.)
        return folder;
    }

    function outputSettingKey(comp) {
        if (!comp || !app.project.file) return null;

        var compId = "";
        try {
            compId = String(comp.id);
        } catch (e) {}

        return "output_" + simpleHash(
            app.project.file.fsName + "::" + comp.name + "::" + compId
        );
    }

    function saveOutputTemplate(comp, templateFile) {
        var key = outputSettingKey(comp);
        if (!templateFile) return;

        try {
            // Global fallback makes Browse reopen at the last path even when
            // the user switches to a comp that has never been rendered before.
            app.settings.saveSetting(
                "SmartRender",
                "last_output_template",
                templateFile.fsName
            );

            if (!key) return;

            app.settings.saveSetting(
                "SmartRender",
                key,
                templateFile.fsName
            );
        } catch (e) {}
    }

    function loadOutputTemplate(comp, allowGlobalFallback) {
        if (allowGlobalFallback === undefined) allowGlobalFallback = true;

        var key = outputSettingKey(comp);

        try {
            if (key && app.settings.haveSetting("SmartRender", key)) {
                var path = app.settings.getSetting("SmartRender", key);
                if (path && String(path).length) {
                    return parseOutputSelection(path, comp).templateFile;
                }
            }

            // The global fallbacks below deliberately return another comp's
            // path. Callers that must stay comp-specific (auto-follow, Refresh)
            // pass allowGlobalFallback = false.
            if (!allowGlobalFallback) return null;

            if (app.settings.haveSetting("SmartRender", "last_output_template")) {
                var lastPath = app.settings.getSetting(
                    "SmartRender",
                    "last_output_template"
                );

                if (lastPath && String(lastPath).length) {
                    return parseOutputSelection(lastPath, comp).templateFile;
                }
            }

            // Migrate the v2.6 global folder preference once.
            if (app.settings.haveSetting("SmartRender", "last_output_folder")) {
                var oldFolderPath = app.settings.getSetting(
                    "SmartRender",
                    "last_output_folder"
                );

                if (oldFolderPath && String(oldFolderPath).length) {
                    return parseOutputSelection(oldFolderPath, comp).templateFile;
                }
            }
        } catch (e) {}

        return null;
    }

    // For a comp that has never had its own output folder chosen, put it beside
    // the sibling comps: <container of the last render>\<CompName>\<CompName>_.png
    function deriveSiblingTemplate(comp) {
        if (!comp) return null;

        var lastPath = "";
        try {
            if (app.settings.haveSetting("SmartRender", "last_output_template")) {
                lastPath = String(app.settings.getSetting(
                    "SmartRender",
                    "last_output_template"
                ) || "");
            }
        } catch (e) {}

        if (!lastPath.length) return null;

        var lastFolder = null;
        try {
            lastFolder = parseOutputSelection(lastPath, comp).folder;
        } catch (parseErr) {}

        if (!lastFolder) return null;

        // The established layout is one name-folder per comp, so the previous
        // render's parent folder is the shared container for all episodes.
        var container = lastFolder.parent || lastFolder;
        var name = safeName(comp.name);

        return makeOutputTemplate(
            new Folder(container.fsName + "\\" + name),
            name
        );
    }

    // A per-comp saved path can be stale/poisoned from an earlier session where
    // the File field showed the wrong comp's folder when Render was pressed.
    // Flag it when its folder is named exactly after a DIFFERENT comp.
    function templateLooksMisassigned(template, comp) {
        if (!template || !comp) return false;

        var folderName = "";
        try {
            folderName = getFolderName(template.parent);
        } catch (e) {
            return false;
        }
        if (!folderName || folderName === safeName(comp.name)) return false;

        var proj = app.project;
        for (var i = 1; i <= proj.numItems; i++) {
            var it = proj.item(i);
            if (it instanceof CompItem && it !== comp &&
                safeName(it.name) === folderName) {
                return true;
            }
        }
        return false;
    }

    function saveCrfSetting(value) {
        var crf = Math.max(14, Math.min(28, Math.round(Number(value))));

        try {
            app.settings.saveSetting(
                "SmartRender",
                "mp4_crf",
                String(crf)
            );
        } catch (e) {}
    }

    function loadCrfSetting() {
        try {
            if (app.settings.haveSetting("SmartRender", "mp4_crf")) {
                var value = parseInt(
                    app.settings.getSetting("SmartRender", "mp4_crf"),
                    10
                );

                if (!isNaN(value)) {
                    return Math.max(14, Math.min(28, value));
                }
            }
        } catch (e) {}

        return 18;
    }

    function saveIncrementMp4Setting(value) {
        try {
            app.settings.saveSetting(
                "SmartRender",
                "increment_mp4",
                value ? "1" : "0"
            );
        } catch (e) {}
    }

    function loadIncrementMp4Setting() {
        try {
            if (app.settings.haveSetting("SmartRender", "increment_mp4")) {
                return app.settings.getSetting(
                    "SmartRender",
                    "increment_mp4"
                ) === "1";
            }
        } catch (e) {}

        return false;
    }

    function saveAutoFollowSetting(value) {
        try {
            app.settings.saveSetting(
                "SmartRender",
                "auto_follow_comp",
                value ? "1" : "0"
            );
        } catch (e) {}
    }

    function loadAutoFollowSetting() {
        try {
            if (app.settings.haveSetting("SmartRender", "auto_follow_comp")) {
                return app.settings.getSetting(
                    "SmartRender",
                    "auto_follow_comp"
                ) === "1";
            }
        } catch (e) {}

        // Smart Render v1 default: keep the output pointed at the active comp.
        return true;
    }

    function saveAlphaSetting(value) {
        try {
            app.settings.saveSetting(
                "SmartRender",
                "png_alpha",
                value ? "1" : "0"
            );
        } catch (e) {}
    }

    function loadAlphaSetting() {
        try {
            if (app.settings.haveSetting("SmartRender", "png_alpha")) {
                return app.settings.getSetting(
                    "SmartRender",
                    "png_alpha"
                ) === "1";
            }
        } catch (e) {}

        // Preserve the behavior of all versions before v3.2.
        return true;
    }

    function saveRenderModeSetting(value) {
        try {
            app.settings.saveSetting(
                "SmartRender",
                "render_mode",
                String(value || "FAST_MP4")
            );
        } catch (e) {}
    }

    function loadRenderModeSetting() {
        try {
            // One-time v5 migration: make the new lossless parallel pipeline
            // the first mode users test, without resetting later choices.
            if (!app.settings.haveSetting(
                    "SmartRender",
                    "parallel_png_default_v5"
                )) {
                app.settings.saveSetting(
                    "SmartRender",
                    "parallel_png_default_v5",
                    "1"
                );
                app.settings.saveSetting(
                    "SmartRender",
                    "render_mode",
                    "PARALLEL_PNG"
                );
                return "PARALLEL_PNG";
            }

            if (app.settings.haveSetting("SmartRender", "render_mode")) {
                var value = app.settings.getSetting(
                    "SmartRender",
                    "render_mode"
                );

                if (value === "PARALLEL_PNG" ||
                    value === "FAST_MP4" ||
                    value === "FAST_PNG" ||
                    value === "JPEG" ||
                    value === "PNG") {
                    return value;
                }
            }
        } catch (e) {}

        // Delivery MP4 is the sensible default for course/video work.
        return "PARALLEL_PNG";
    }

    function chooseMp4Output(movieFolder, movieBase, incrementIfExists) {
        var stem = safeName(movieBase);
        var candidate = new File(
            movieFolder.fsName + "\\" + stem + ".mp4"
        );

        if (incrementIfExists) {
            var index = 1;
            var indexedStem = "";

            while (index < 100000) {
                indexedStem = stem + "_" + index;
                candidate = new File(
                    movieFolder.fsName + "\\" + indexedStem + ".mp4"
                );

                if (!candidate.exists) {
                    stem = indexedStem;
                    break;
                }

                index++;
            }
        }

        return {
            stem: stem,
            file: candidate,
            fileName: stem + ".mp4"
        };
    }

    function findAerender() {
        var paths = [];

        try {
            paths.push(Folder.appPackage.fsName + "\\aerender.exe");
        } catch (e1) {}

        try {
            paths.push(Folder.startup.fsName + "\\aerender.exe");
            if (Folder.startup.parent) {
                paths.push(Folder.startup.parent.fsName + "\\aerender.exe");
                if (Folder.startup.parent.parent) {
                    paths.push(Folder.startup.parent.parent.fsName + "\\aerender.exe");
                }
            }
        } catch (e2) {}

        var i, f;
        for (i = 0; i < paths.length; i++) {
            f = new File(paths[i]);
            if (f.exists) return f;
        }

        // Last resort: ask Windows PATH.
        try {
            var out = system.callSystem('cmd.exe /d /s /c "where aerender.exe 2>nul"');
            if (out) {
                var lines = out.replace(/\r/g, "").split("\n");
                for (i = 0; i < lines.length; i++) {
                    if (lines[i].length) {
                        f = new File(lines[i]);
                        if (f.exists) return f;
                    }
                }
            }
        } catch (e3) {}

        return null;
    }

    function findFFmpeg() {
        // Preferred: use the FFmpeg bundled with Shutter Encoder.
        // This avoids requiring FFmpeg to be installed separately or added to PATH.
        var knownPaths = [
            "C:\\Program Files\\Shutter Encoder\\app\\Library\\ffmpeg.exe",
            "C:\\Program Files\\Shutter Encoder\\Library\\ffmpeg.exe"
        ];

        for (var i = 0; i < knownPaths.length; i++) {
            try {
                var known = new File(knownPaths[i]);
                if (known.exists) {
                    return known;
                }
            } catch (knownErr) {}
        }

        // Fallback: use any FFmpeg available through Windows PATH.
        try {
            var out = system.callSystem(
                'cmd.exe /d /s /c "where ffmpeg.exe 2>nul"'
            );

            if (out) {
                var lines = out.replace(/\r/g, "").split("\n");

                for (var j = 0; j < lines.length; j++) {
                    if (lines[j].length) {
                        var f = new File(lines[j]);
                        if (f.exists) {
                            return f;
                        }
                    }
                }
            }
        } catch (e) {}

        return null;
    }

    function getTemplates(comp) {
        var result = {
            renderTemplate: null,
            audioRenderTemplate: null,
            pngTemplate: null,
            pngAlphaTemplate: null,
            pngRgbTemplate: null,
            pngTemplates: [],
            tiffTemplate: null,
            tiffAlphaTemplate: null,
            tiffTemplates: [],
            jpegTemplate: null,
            jpegTemplates: [],
            h264Template: null,
            h264AudioTemplate: null,
            h264Templates: [],
            audioTemplate: null,
            audioTemplates: []
        };

        var rqItem = null;

        try {
            rqItem = app.project.renderQueue.items.add(comp);

            var rsTemplates = rqItem.templates;
            var i, t, low;

            for (i = 0; i < rsTemplates.length; i++) {
                t = String(rsTemplates[i]);
                low = t.toLowerCase();

                if (t === "Multi-Machine Settings") {
                    result.renderTemplate = t;
                }

                if (!result.renderTemplate &&
                    (low.indexOf("multi-machine") !== -1 ||
                     low.indexOf("multi machine") !== -1)) {
                    result.renderTemplate = t;
                }

                if (t === "Best Settings") {
                    result.audioRenderTemplate = t;
                } else if (!result.audioRenderTemplate &&
                           low.indexOf("best settings") !== -1) {
                    result.audioRenderTemplate = t;
                }
            }

            var om = rqItem.outputModule(1);
            var omTemplates = om.templates;

            for (i = 0; i < omTemplates.length; i++) {
                t = String(omTemplates[i]);
                low = t.toLowerCase();

                if (low.indexOf("png") !== -1) {
                    result.pngTemplates.push(t);

                    if (low === "_png_alpha_frame") {
                        result.pngAlphaTemplate = t;
                    }

                    if (low === "_png_sequence") {
                        result.pngRgbTemplate = t;
                    }

                    if (t === "PNG Sequence") {
                        result.pngTemplate = t;
                    } else if (!result.pngTemplate) {
                        result.pngTemplate = t;
                    }
                }

                // Template names are user-defined and cannot prove the actual
                // format. Apply each candidate temporarily and inspect Format.
                // This rejects templates named "WAV" that still contain H.264.
                var actualFormat = "";

                try {
                    om = rqItem.outputModule(1);
                    om.applyTemplate(t);
                    om = rqItem.outputModule(1);

                    var omSettings = om.getSettings(GetSettingsFormat.STRING);
                    if (omSettings && omSettings["Format"]) {
                        actualFormat = String(omSettings["Format"]);
                    }
                } catch (formatErr) {}

                var actualFormatLow = actualFormat.toLowerCase();

                if (actualFormatLow.indexOf("tiff") !== -1 ||
                    actualFormatLow === "tif") {
                    result.tiffTemplates.push(t);

                    var channelsSetting = "";
                    try {
                        if (omSettings && omSettings["Channels"]) {
                            channelsSetting = String(
                                omSettings["Channels"]
                            ).toLowerCase();
                        }
                    } catch (tiffChannelsErr) {}

                    var hasAlpha = channelsSetting.indexOf("alpha") !== -1 ||
                        low.indexOf("alpha") !== -1;

                    if (hasAlpha && !result.tiffAlphaTemplate) {
                        result.tiffAlphaTemplate = t;
                    }

                    if (!result.tiffTemplate ||
                        low === "tiff sequence" ||
                        low === "_tiff_sequence") {
                        result.tiffTemplate = t;
                    }
                }

                if (actualFormatLow.indexOf("jpeg") !== -1 ||
                    actualFormatLow === "jpg") {
                    result.jpegTemplates.push(t);

                    if (!result.jpegTemplate ||
                        low === "_jpg_sequence" ||
                        low === "jpeg sequence") {
                        result.jpegTemplate = t;
                    }
                }

                if (actualFormatLow.indexOf("h.264") !== -1 ||
                    actualFormatLow.indexOf("h264") !== -1) {
                    result.h264Templates.push(t);

                    var currentH264Low = String(
                        result.h264Template || ""
                    ).toLowerCase();
                    if (!result.h264Template ||
                        low === "_h.264 this one" ||
                        (currentH264Low !== "_h.264 this one" &&
                         low.indexOf("15 mbps") !== -1)) {
                        result.h264Template = t;
                    }

                    var audioSetting = "";
                    try {
                        if (omSettings &&
                            typeof omSettings["Audio Output"] !== "undefined") {
                            audioSetting = String(
                                omSettings["Audio Output"]
                            ).toLowerCase();
                        }
                    } catch (audioSettingErr) {}

                    if (audioSetting === "on" ||
                        audioSetting === "true" ||
                        audioSetting === "1") {
                        var currentAudioH264Low = String(
                            result.h264AudioTemplate || ""
                        ).toLowerCase();
                        if (!result.h264AudioTemplate ||
                            low === "_h.264 this one" ||
                            (currentAudioH264Low !== "_h.264 this one" &&
                             low.indexOf("15 mbps") !== -1)) {
                            result.h264AudioTemplate = t;
                        }
                    }
                }

                if (actualFormatLow.indexOf("waveform") !== -1 ||
                    actualFormatLow === "wav" ||
                    actualFormatLow === "wave") {
                    result.audioTemplates.push(t);

                    if (!result.audioTemplate ||
                        t === "WAV" ||
                        t === "Waveform Audio") {
                        result.audioTemplate = t;
                    }
                }
            }

        } catch (err) {
            // handled below
        } finally {
            try {
                if (rqItem) rqItem.remove();
            } catch (removeErr) {}
        }

        return result;
    }

    function compStartFrame(comp) {
        try {
            if (typeof comp.displayStartFrame !== "undefined") {
                return comp.displayStartFrame;
            }
        } catch (e) {}

        return Math.round(comp.displayStartTime / comp.frameDuration);
    }

    function getFrameRange(comp, useWorkArea) {
        var first = compStartFrame(comp);

        if (useWorkArea) {
            var start = first + Math.round(comp.workAreaStart / comp.frameDuration);
            var count = Math.max(1, Math.round(comp.workAreaDuration / comp.frameDuration));
            return {
                start: start,
                end: start + count - 1
            };
        }

        var fullCount = Math.max(1, Math.round(comp.duration / comp.frameDuration));
        return {
            start: first,
            end: first + fullCount - 1
        };
    }

    function fpsString(comp) {
        var s = comp.frameRate.toFixed(6);
        s = s.replace(/0+$/, "");
        s = s.replace(/\.$/, "");
        return s;
    }

    function ensureFolder(folder) {
        if (!folder.exists) {
            if (!folder.create()) {
                throw new Error("Could not create folder:\n" + folder.fsName);
            }
        }
    }

    function writeTextFile(file, text) {
        file.encoding = "UTF-8";
        if (!file.open("w")) {
            throw new Error("Could not write:\n" + file.fsName);
        }
        file.write(text);
        file.close();
    }

    function readTextFile(file) {
        if (!file || !file.exists) return "";

        file.encoding = "UTF-8";
        if (!file.open("r")) return "";

        var text = file.read();
        file.close();

        return String(text).replace(/^\uFEFF/, "");
    }

    function simpleHash(s) {
        // Small deterministic hash only for generating a safe manifest filename.
        // It is not used for security.
        var h = 5381;
        s = String(s);

        for (var i = 0; i < s.length; i++) {
            h = ((h << 5) + h) ^ s.charCodeAt(i);
            h = h & 0x7fffffff;
        }

        return h.toString(16);
    }

    // ---------- batch list persistence ----------

    function jsonEscape(s) {
        s = String(s);
        var out = "";

        for (var i = 0; i < s.length; i++) {
            var c = s.charAt(i);
            var code = s.charCodeAt(i);

            if (c === '"') out += '\\"';
            else if (c === "\\") out += "\\\\";
            else if (c === "\n") out += "\\n";
            else if (c === "\r") out += "\\r";
            else if (c === "\t") out += "\\t";
            else if (code < 32) {
                out += "\\u" + ("0000" + code.toString(16)).slice(-4);
            } else {
                out += c;
            }
        }

        return out;
    }

    // The saved lists live in the PROJECT FOLDER under a fixed name - not tied
    // to the .aep filename - so incrementing the project (v1.59 -> v1.60) keeps
    // every saved list. Survives an AE prefs reset and travels with the folder.
    function batchSidecarFile() {
        if (!app.project.file) return null;

        return new File(
            app.project.file.parent.fsName + "\\smartrender-batch.json"
        );
    }

    // Older builds named it <aepname>.smartrender-batch.json, one per .aep
    // version. Pick the RICHEST one (most saved lists / queue items), not just
    // the newest - a freshly incremented .aep often left behind an empty file.
    function legacyBatchSidecarFile() {
        if (!app.project.file) return null;

        var folder = app.project.file.parent;
        var all;

        try {
            all = folder.getFiles("*.smartrender-batch.json");
        } catch (e) {
            return null;
        }

        var best = null;
        var bestListCount = -1;
        var bestItemCount = -1;
        var bestMs = -1;

        for (var i = 0; i < all.length; i++) {
            var f = all[i];
            if (!(f instanceof File)) continue;
            if (f.name.toLowerCase() === "smartrender-batch.json") continue;

            var doc = parseBatchDoc(readTextFile(f));
            var listCount = 0;
            for (var k in doc.lists) {
                if (doc.lists.hasOwnProperty(k)) listCount++;
            }
            var itemCount = doc.current ? doc.current.length : 0;
            var ms = f.modified.getTime();

            // Prefer more saved lists, then more queue items, then newer.
            var better =
                listCount > bestListCount ||
                (listCount === bestListCount && itemCount > bestItemCount) ||
                (listCount === bestListCount && itemCount === bestItemCount &&
                    ms > bestMs);

            if (better) {
                best = f;
                bestListCount = listCount;
                bestItemCount = itemCount;
                bestMs = ms;
            }
        }

        return best;
    }

    function cloneBatchItems(items) {
        var out = [];
        for (var i = 0; i < (items ? items.length : 0); i++) {
            var it = items[i] || {};
            out.push({
                compId: (typeof it.compId === "number" && isFinite(it.compId)) ?
                    it.compId : null,
                compName: String(it.compName || ""),
                outputText: String(it.outputText || ""),
                checked: it.checked ? true : false
            });
        }
        return out;
    }

    function serializeItems(items, indent) {
        var rows = [];
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var idText = (typeof it.compId === "number" && isFinite(it.compId)) ?
                String(it.compId) : "null";
            rows.push(
                indent + '  { "checked": ' + (it.checked ? "true" : "false") +
                ', "compId": ' + idText +
                ', "compName": "' + jsonEscape(it.compName) + '"' +
                ', "output": "' + jsonEscape(it.outputText) + '" }'
            );
        }
        return "[\r\n" + rows.join(",\r\n") +
            (rows.length ? "\r\n" : "") + indent + "]";
    }

    // v2 doc: { current: [items], lists: { "name": [items], ... } }
    function serializeBatchDoc(current, lists) {
        var parts = [];
        parts.push('  "version": 2');
        parts.push('  "current": ' + serializeItems(current || [], "  "));

        var names = [];
        for (var k in lists) {
            if (lists.hasOwnProperty(k)) names.push(k);
        }
        names.sort();

        var listRows = [];
        for (var n = 0; n < names.length; n++) {
            listRows.push(
                '    "' + jsonEscape(names[n]) + '": ' +
                serializeItems(lists[names[n]] || [], "    ")
            );
        }
        parts.push('  "lists": {' +
            (listRows.length ? "\r\n" + listRows.join(",\r\n") + "\r\n  " : "") +
            "}");

        return "{\r\n" + parts.join(",\r\n") + "\r\n}\r\n";
    }

    function parseItemsArray(arr) {
        var out = [];
        if (!(arr instanceof Array)) return out;
        for (var i = 0; i < arr.length; i++) {
            var r = arr[i];
            if (!r) continue;
            out.push({
                checked: r.checked ? true : false,
                compId: (typeof r.compId === "number" && isFinite(r.compId)) ?
                    r.compId : null,
                compName: String(r.compName || ""),
                outputText: String(
                    typeof r.output !== "undefined" ? r.output : (r.outputText || "")
                )
            });
        }
        return out;
    }

    function parseBatchDoc(text) {
        var empty = { current: [], lists: {} };

        // readTextFile() already strips a UTF-8 BOM.
        text = String(text || "").replace(/^\s+|\s+$/g, "");
        if (text.length && text.charCodeAt(0) === 65279) {
            text = text.substring(1);
        }
        if (!text || text.charAt(0) !== "{") return empty;

        var data = null;

        // The file is written only by this script and lives next to the user's
        // own project. ExtendScript has no JSON parser; evaluating a plain
        // object literal is the standard workaround.
        try {
            data = eval("(" + text + ")");
        } catch (e) {
            return empty;
        }
        if (!data) return empty;

        // v1 migration: { version: 1, items: [...] }  ->  current
        if (data.items instanceof Array && !data.current) {
            return { current: parseItemsArray(data.items), lists: {} };
        }

        var result = { current: parseItemsArray(data.current), lists: {} };

        if (data.lists && typeof data.lists === "object") {
            for (var k in data.lists) {
                if (data.lists.hasOwnProperty(k)) {
                    result.lists[String(k)] = parseItemsArray(data.lists[k]);
                }
            }
        }

        return result;
    }

    function findCompByIdOrName(compId, compName) {
        var proj = app.project;
        var i, it;

        if (compId !== null && isFinite(compId)) {
            for (i = 1; i <= proj.numItems; i++) {
                it = proj.item(i);
                if (it instanceof CompItem) {
                    try {
                        if (it.id === compId) return it;
                    } catch (e) {}
                }
            }
        }

        if (compName) {
            for (i = 1; i <= proj.numItems; i++) {
                it = proj.item(i);
                if (it instanceof CompItem && it.name === compName) return it;
            }
        }

        return null;
    }

    function saveStopOnErrorSetting(value) {
        try {
            app.settings.saveSetting(
                "SmartRender",
                "batch_stop_on_error",
                value ? "1" : "0"
            );
        } catch (e) {}
    }

    function loadStopOnErrorSetting() {
        try {
            if (app.settings.haveSetting("SmartRender", "batch_stop_on_error")) {
                return app.settings.getSetting(
                    "SmartRender",
                    "batch_stop_on_error"
                ) === "1";
            }
        } catch (e) {}

        return false;
    }

    function getJobManifestFile(comp) {
        if (!comp || !app.project.file) return null;

        var compId = "";
        try {
            compId = String(comp.id);
        } catch (e) {}

        var key =
            app.project.file.fsName + "::" +
            comp.name + "::" +
            compId;

        return new File(
            Folder.temp.fsName +
            "\\AE_SmartRender_active_" +
            simpleHash(key) +
            ".job"
        );
    }

    function writeJobManifest(file, data) {
        if (!file) return;

        var keys = [
            "projectPath",
            "compName",
            "compId",
            "outputFolder",
            "outputBase",
            "baseName",
            "startFrame",
            "endFrame",
            "totalFrames",
            "makeMP4",
            "qualityMode",
            "resolutionPct",
            "includeAlpha",
            "renderMode",
            "frameExtension",
            "crf",
            "initialCached",
            "framesToRender",
            "progressPath",
            "currentFramePath",
            "renderDonePath",
            "retryPath",
            "audioStartedPath",
            "audioDonePath",
            "encodeStartedPath",
            "encodeDonePath",
            "donePath",
            "renderFailPath",
            "audioFailPath",
            "encodeFailPath",
            "processIdPath",
            "workerIdPath",
            "cancelPath",
            "jobStartTime",
            "logPath",
            "aeLogPath",
            "finalOutputPath",
            "jobFolder"
        ];

        var lines = ["version=1"];

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = data[key];

            if (typeof value === "undefined" || value === null) {
                value = "";
            }

            // Windows paths and comp names cannot contain literal newlines.
            value = String(value).replace(/\r/g, "").replace(/\n/g, " ");
            lines.push(key + "=" + value);
        }

        writeTextFile(file, lines.join("\r\n"));
    }

    function readJobManifest(file) {
        if (!file || !file.exists) return null;

        file.encoding = "UTF-8";

        if (!file.open("r")) return null;

        var raw = file.read();
        file.close();

        raw = raw.replace(/^\uFEFF/, "");

        var lines = raw.replace(/\r/g, "").split("\n");
        var data = {};

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var eq = line.indexOf("=");

            if (eq <= 0) continue;

            var key = line.substring(0, eq);
            var value = line.substring(eq + 1);
            data[key] = value;
        }

        if (!data.outputFolder ||
            !data.baseName ||
            !data.startFrame ||
            !data.endFrame ||
            !data.totalFrames) {
            return null;
        }

        data.startFrame = parseInt(data.startFrame, 10);
        data.endFrame = parseInt(data.endFrame, 10);
        data.totalFrames = parseInt(data.totalFrames, 10);
        data.makeMP4 = String(data.makeMP4) === "1";
        data.qualityMode = data.qualityMode || "FINAL";
        data.resolutionPct = parseInt(data.resolutionPct || "100", 10);
        data.includeAlpha =
            typeof data.includeAlpha === "undefined" ||
            data.includeAlpha === "" ?
            true :
            String(data.includeAlpha) === "1";
        data.renderMode = data.renderMode || "PNG";
        data.frameExtension = data.frameExtension ||
            (data.renderMode === "JPEG" ? "jpg" : "png");
        data.crf = parseInt(data.crf || "18", 10);

        // v1.2 progress fields. Defaults keep older manifests reconnectable.
        data.initialCached = parseInt(data.initialCached || "0", 10);
        data.framesToRender = parseInt(
            data.framesToRender || String(data.totalFrames),
            10
        );
        data.jobStartTime = parseFloat(data.jobStartTime || "0");

        if (isNaN(data.startFrame) ||
            isNaN(data.endFrame) ||
            isNaN(data.totalFrames) ||
            isNaN(data.resolutionPct) ||
            isNaN(data.crf) ||
            isNaN(data.initialCached) ||
            isNaN(data.framesToRender) ||
            isNaN(data.jobStartTime)) {
            return null;
        }

        data.manifestPath = file.fsName;
        return data;
    }

    function removeJobManifest(path) {
        if (!path) return;

        try {
            var f = new File(path);
            if (f.exists) f.remove();
        } catch (e) {}
    }

    function readPidList(path) {
        var result = [];
        if (!path || !String(path).length) return result;

        var text = "";
        try {
            text = readTextFile(new File(path));
        } catch (e) {}

        var matches = String(text).match(/\d+/g) || [];
        for (var i = 0; i < matches.length; i++) {
            var pid = parseInt(matches[i], 10);
            if (!isNaN(pid) && pid > 0) result.push(pid);
        }

        return result;
    }

    function processNameForPid(pid) {
        pid = parseInt(pid, 10);
        if (isNaN(pid) || pid <= 0) return "";

        try {
            var out = system.callSystem(
                'powershell.exe -NoLogo -NoProfile -NonInteractive -Command ' +
                q("$p=Get-Process -Id " + pid +
                  " -ErrorAction SilentlyContinue; if($p){$p.ProcessName}")
            );
            return String(out || "").replace(/^\s+|\s+$/g, "");
        } catch (e) {}

        return "";
    }

    function jobHasLiveProcess(data) {
        if (!data) return false;

        var rootPids = readPidList(data.processIdPath || "");
        var workerPids = readPidList(data.workerIdPath || "");
        var all = rootPids.concat(workerPids);

        for (var i = 0; i < all.length; i++) {
            if (processNameForPid(all[i]).length) return true;
        }

        return false;
    }

    function findRunningSmartRenderJob() {
        var entries = Folder.temp.getFiles("AE_SmartRender_*");
        var newest = null;

        for (var i = 0; i < entries.length; i++) {
            if (!(entries[i] instanceof Folder)) continue;

            var manifestFile = new File(
                entries[i].fsName + "\\SMART_RENDER_JOB.info"
            );
            if (!manifestFile.exists) continue;

            var data = readJobManifest(manifestFile);
            if (!data) continue;

            var recentlyStarted = !jobManifestIsFinished(data) &&
                data.jobStartTime > 0 &&
                (new Date().getTime() - data.jobStartTime) < 120000;

            if (jobHasLiveProcess(data) || recentlyStarted) {
                if (!newest || data.jobStartTime > newest.data.jobStartTime) {
                    newest = {file: manifestFile, data: data};
                }
            } else if (jobManifestIsFinished(data)) {
                removeJobManifest(manifestFile.fsName);
            }
        }

        return newest;
    }

    function stopTrackedProcess(pid, expectedName, includeTree) {
        pid = parseInt(pid, 10);
        if (isNaN(pid) || pid <= 0) return false;

        var actualName = processNameForPid(pid).toLowerCase();
        var wanted = String(expectedName || "").toLowerCase();
        actualName = actualName.replace(/\.(exe|com)$/i, "");
        wanted = wanted.replace(/\.(exe|com)$/i, "");
        if (!actualName.length) return true;
        if (wanted.length && actualName !== wanted) return false;

        try {
            var command = "taskkill.exe /PID " + pid;
            if (includeTree) command += " /T";
            command += " /F >nul 2>&1";
            system.callSystem('cmd.exe /d /s /c "' + command + '"');
        } catch (e) {}

        return !processNameForPid(pid).length;
    }

    function discoverJobAfterFxPids(state) {
        if (!state || !state.startTimeMs) return [];

        var project = String(state.projectPath || "").replace(/'/g, "''");
        var script =
            "$since=[DateTimeOffset]::FromUnixTimeMilliseconds(" +
            Math.floor(Number(state.startTimeMs)) +
            ").UtcDateTime.AddSeconds(-15);" +
            "$project='" + project + "';" +
            "Get-CimInstance Win32_Process -Filter \"Name='AfterFX.com'\" " +
            "-ErrorAction SilentlyContinue | Where-Object {" +
            "$p=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue;" +
            "$p -and $p.StartTime.ToUniversalTime() -ge $since -and " +
            "(-not $project -or [string]$_.CommandLine -like ('*'+$project+'*'))" +
            "} | Select-Object -ExpandProperty ProcessId";

        try {
            var out = system.callSystem(
                "powershell.exe -NoLogo -NoProfile -NonInteractive -Command " +
                q(script)
            );
            var matches = String(out || "").match(/\d+/g) || [];
            var result = [];
            for (var i = 0; i < matches.length; i++) {
                var pid = parseInt(matches[i], 10);
                if (!isNaN(pid) && pid > 0) result.push(pid);
            }
            return result;
        } catch (e) {}

        return [];
    }

    function openPath(path) {
        try {
            var f = new File(path);
            if (f.exists) {
                f.execute();
                return;
            }

            var folder = new Folder(path);
            if (folder.exists) folder.execute();
        } catch (e) {}
    }


    // A Save dialog gives us the normal Windows Explorer UI and lets the user
    // choose both a folder and a useful sequence name. Nothing is written by
    // this dialog. Selecting an existing frame such as name_00042.png simply
    // reconnects Smart Render to the normalized name_.png sequence.
    // Which frame-sequence base name is actually cached in this folder?
    // Returns e.g. "1.3.2 Activations & Checks v1" from files named
    // "1.3.2 Activations & Checks v1_RGB_00092.png". Result is memoized per
    // folder for the session - this can scan folders with thousands of frames
    // and runs on every auto-follow / Refresh.
    var sequenceBaseCache = {};

    function detectSequenceBaseInFolder(folder) {
        if (!folder) return null;

        var keyPath;
        try {
            keyPath = folder.fsName;
        } catch (keyErr) {
            keyPath = String(folder);
        }

        if (sequenceBaseCache.hasOwnProperty(keyPath)) {
            return sequenceBaseCache[keyPath] || null;
        }

        var result = null;

        if (folder.exists) {
            var exts = ["png", "jpg", "jpeg"];
            var bestBase = null;
            var bestCount = 0;

            for (var e = 0; e < exts.length; e++) {
                var files;
                try {
                    files = folder.getFiles("*." + exts[e]);
                } catch (err) {
                    continue;
                }

                var counts = {};
                for (var i = 0; i < files.length; i++) {
                    if (!(files[i] instanceof File)) continue;

                    var nm = decodedFileName(files[i]);
                    if (!/_(-?\d{2,})\.(?:png|jpe?g)$/i.test(nm)) continue;

                    var b = sequenceBaseFromFileName(nm);
                    counts[b] = (counts[b] || 0) + 1;
                }

                for (var k in counts) {
                    if (counts.hasOwnProperty(k) && counts[k] > bestCount) {
                        bestCount = counts[k];
                        bestBase = k;
                    }
                }
            }

            if (bestCount >= 2) result = bestBase;
        }

        sequenceBaseCache[keyPath] = result || "";
        return result;
    }

    function forgetSequenceBaseCache() {
        sequenceBaseCache = {};
    }

    // When the user picks an existing delivered .mp4 (e.g. "...v1.1.mp4"),
    // reuse the frame sequence already sitting in that folder instead of a
    // literal "...v1.1" base that matches nothing. A fresh render with no
    // cached frames just drops the trailing ".N" delivery-version suffix.
    function resolveSequenceBaseFromPick(pickedFile) {
        var rawBase = sequenceBaseFromFileName(pickedFile.name);

        if (/\.mp4$/i.test(pickedFile.name)) {
            var seqBase = detectSequenceBaseInFolder(pickedFile.parent);
            if (seqBase) return seqBase;
            // Drop a delivery-version suffix: new "_2", or legacy ".2".
            return rawBase.replace(/[._]\d+$/, "");
        }

        return rawBase;
    }

    function modernPngSequenceDialog(title, initialTemplate) {
        var seed = initialTemplate;

        try {
            if (!seed) {
                seed = new File(Folder.desktop.fsName + "\\Render_.png");
            }
        } catch (seedErr) {
            seed = new File(Folder.desktop.fsName + "\\Render_.png");
        }

        // File.saveDlg can start from a file whose final render folder does not
        // exist yet, but Windows needs an existing directory to open in.
        try {
            var seedName = seed.name || "Render_.png";
            var seedFolder = seed.parent;

            while (seedFolder && !seedFolder.exists) {
                var seedParent = seedFolder.parent;
                if (!seedParent || seedParent.fsName === seedFolder.fsName) {
                    break;
                }
                seedFolder = seedParent;
            }

            if (seedFolder && seedFolder.exists) {
                seed = new File(seedFolder.fsName + "\\" + seedName);
            }
        } catch (existingFolderErr) {}

        var pickedFile = null;

        try {
            pickedFile = seed.saveDlg(
                title || "Choose render output name",
                "Render output:*.png;*.jpg;*.jpeg;*.mp4"
            );
        } catch (err) {
            alert(
                "Could not open the Windows file browser:\n\n" +
                err.toString()
            );
            return null;
        }

        if (!pickedFile) return null;

        return makeOutputTemplate(
            pickedFile.parent,
            resolveSequenceBaseFromPick(pickedFile)
        );
    }


    function escapeRegExp(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function decodedFileName(file) {
        var name = "";

        try {
            name = String(file.name || "");
        } catch (nameErr) {}

        try {
            name = decodeURI(name);
        } catch (decodeErr) {}

        return name;
    }

    function countRenderedFrames(folderPath, baseName, startFrame, endFrame, extension) {
        var folder = new Folder(folderPath);
        if (!folder.exists) return 0;

        var ext = String(extension || "png").replace(/^\./, "");
        var escapedBase = escapeRegExp(baseName);
        var re = new RegExp(
            "^" + escapedBase + "_(-?\\d+)\\." + escapeRegExp(ext) + "$",
            "i"
        );

        var files;
        try {
            files = folder.getFiles("*." + ext);
        } catch (e) {
            return 0;
        }

        var count = 0;
        for (var i = 0; i < files.length; i++) {
            if (!(files[i] instanceof File)) continue;

            var m = re.exec(decodedFileName(files[i]));
            if (!m) continue;

            var byteLength = 0;
            try {
                byteLength = files[i].length;
            } catch (lengthErr) {}

            // A zero-byte image is an interrupted write, never a cached frame.
            if (byteLength <= 0) continue;

            var frameNum = parseInt(m[1], 10);
            if (!isNaN(frameNum) &&
                frameNum >= startFrame &&
                frameNum <= endFrame) {
                count++;
            }
        }

        return count;
    }

    function readBackgroundProgressCount(path, totalFrames) {
        if (!path || !String(path).length) return null;

        try {
            var file = new File(path);
            if (!file.exists) return null;

            var value = parseInt(
                readTextFile(file).replace(/^\s+|\s+$/g, ""),
                10
            );

            if (isNaN(value)) return null;
            if (value < 0) value = 0;
            if (value > totalFrames) value = totalFrames;
            return value;
        } catch (e) {}

        return null;
    }

    function readIntegerSidecar(path) {
        if (!path || !String(path).length) return null;

        try {
            var file = new File(path);
            if (!file.exists) return null;

            var value = parseInt(
                readTextFile(file).replace(/^\s+|\s+$/g, ""),
                10
            );

            return isNaN(value) ? null : value;
        } catch (e) {}

        return null;
    }

    function getReadyFramesForUI(state) {
        var sidecarCount = readBackgroundProgressCount(
            state.progressPath,
            state.totalFrames
        );

        if (sidecarCount !== null) {
            state.lastReadyFrames = sidecarCount;
            return sidecarCount;
        }

        if (state.renderMode === "FAST_MP4") {
            return typeof state.lastReadyFrames !== "undefined" ?
                state.lastReadyFrames : 0;
        }

        // Older active jobs do not have a sidecar. Reuse their last value and
        // enumerate the PNG directory only occasionally, not every UI tick.
        var nowMs = new Date().getTime();
        var lastScanMs = Number(state.lastFullScanMs || 0);

        if (lastScanMs > 0 &&
            nowMs - lastScanMs < FULL_SCAN_FALLBACK_MS &&
            typeof state.lastReadyFrames !== "undefined") {
            return state.lastReadyFrames;
        }

        var count = countRenderedFrames(
            state.outputFolder,
            state.baseName,
            state.startFrame,
            state.endFrame,
            state.frameExtension || "png"
        );

        state.lastFullScanMs = nowMs;
        state.lastReadyFrames = count;
        return count;
    }

    function snapshotRenderedFrames(folderPath, baseName, startFrame, endFrame, extension) {
        var result = {
            count: 0,
            stamps: {}
        };

        var folder = new Folder(folderPath);
        if (!folder.exists) return result;

        var ext = String(extension || "png").replace(/^\./, "");
        var escapedBase = escapeRegExp(baseName);
        var re = new RegExp(
            "^" + escapedBase + "_(-?\\d+)\\." + escapeRegExp(ext) + "$",
            "i"
        );

        var files;
        try {
            files = folder.getFiles("*." + ext);
        } catch (e) {
            return result;
        }

        for (var i = 0; i < files.length; i++) {
            if (!(files[i] instanceof File)) continue;

            var m = re.exec(decodedFileName(files[i]));
            if (!m) continue;

            var byteLength = 0;
            try {
                byteLength = files[i].length;
            } catch (lengthErr) {}

            if (byteLength <= 0) continue;

            var frameNum = parseInt(m[1], 10);

            if (isNaN(frameNum) ||
                frameNum < startFrame ||
                frameNum > endFrame) {
                continue;
            }

            var stamp = 0;
            try {
                if (files[i].modified) {
                    stamp = files[i].modified.getTime();
                }
            } catch (stampErr) {}

            result.stamps[String(frameNum)] = stamp;
            result.count++;
        }

        return result;
    }

    function missingFrameRanges(startFrame, endFrame, stamps) {
        var ranges = [];
        var openStart = null;
        var frame;

        stamps = stamps || {};

        for (frame = startFrame; frame <= endFrame; frame++) {
            var exists = stamps.hasOwnProperty(String(frame));

            if (!exists && openStart === null) {
                openStart = frame;
            } else if (exists && openStart !== null) {
                ranges.push({start: openStart, end: frame - 1});
                openStart = null;
            }
        }

        if (openStart !== null) {
            ranges.push({start: openStart, end: endFrame});
        }

        return ranges;
    }

    function countFramesTouchedThisRun(
        folderPath,
        baseName,
        startFrame,
        endFrame,
        baseline,
        extension
    ) {
        var current = snapshotRenderedFrames(
            folderPath,
            baseName,
            startFrame,
            endFrame,
            extension
        );

        var touched = 0;

        for (var key in current.stamps) {
            if (!current.stamps.hasOwnProperty(key)) continue;

            var oldStamp = baseline &&
                baseline.stamps &&
                baseline.stamps.hasOwnProperty(key) ?
                baseline.stamps[key] :
                null;

            // New frame, or an existing frame that was rewritten this run.
            if (oldStamp === null ||
                current.stamps[key] > oldStamp) {
                touched++;
            }
        }

        return {
            touched: touched,
            cachedNow: current.count
        };
    }

    function getCachedFrameFiles(folderPath, baseName, startFrame, endFrame, extension) {
        var folder = new Folder(folderPath);
        if (!folder.exists) return [];

        var ext = String(extension || "png").replace(/^\./, "");
        var escapedBase = escapeRegExp(baseName);
        var re = new RegExp(
            "^" + escapedBase + "_(-?\\d+)\\." + escapeRegExp(ext) + "$",
            "i"
        );

        var files;
        try {
            files = folder.getFiles("*." + ext);
        } catch (e) {
            return [];
        }

        var matches = [];

        for (var i = 0; i < files.length; i++) {
            if (!(files[i] instanceof File)) continue;

            var m = re.exec(decodedFileName(files[i]));
            if (!m) continue;

            var frameNum = parseInt(m[1], 10);

            if (!isNaN(frameNum) &&
                frameNum >= startFrame &&
                frameNum <= endFrame) {
                matches.push({
                    file: files[i],
                    frame: frameNum
                });
            }
        }

        // Useful for predictable deletion/reporting.
        matches.sort(function(a, b) {
            return a.frame - b.frame;
        });

        return matches;
    }

    function getCachedFrameFilesAllProfiles(folderPath, compBaseName, startFrame, endFrame) {
        var folder = new Folder(folderPath);
        if (!folder.exists) return [];

        var escapedBase = escapeRegExp(compBaseName);
        var re = new RegExp(
            "^" + escapedBase +
            "(?:_(DRAFT|FINAL)_(33|50|100))?(?:_RGB|_JPG)?_(-?\\d+)\\.(?:png|jpe?g)$",
            "i"
        );

        var files;
        try {
            files = folder.getFiles(function(f) {
                if (!(f instanceof File)) return false;
                return /\.(?:png|jpe?g)$/i.test(decodedFileName(f));
            });
        } catch (e) {
            return [];
        }

        var matches = [];

        for (var i = 0; i < files.length; i++) {
            if (!(files[i] instanceof File)) continue;

            var m = re.exec(decodedFileName(files[i]));
            if (!m) continue;

            var frameNum = parseInt(m[3], 10);

            if (!isNaN(frameNum) &&
                frameNum >= startFrame &&
                frameNum <= endFrame) {

                var profileName = (m[1] && m[2]) ?
                    (String(m[1]).toUpperCase() + " " + m[2] + "%") :
                    "FINAL 100%";

                matches.push({
                    file: files[i],
                    frame: frameNum,
                    profile: profileName
                });
            }
        }

        matches.sort(function(a, b) {
            if (a.frame !== b.frame) return a.frame - b.frame;
            if (a.profile < b.profile) return -1;
            if (a.profile > b.profile) return 1;
            return 0;
        });

        return matches;
    }

    function frameToTimeString(comp, frameNumber) {
        var fps = comp.frameRate;
        var startFrame = compStartFrame(comp);

        // Convert the absolute display frame number back to comp-relative time.
        var seconds = (frameNumber - startFrame) / fps;

        // timeToCurrentFormat respects the project's current time display.
        try {
            return timeToCurrentFormat(seconds, fps, false);
        } catch (e) {
            return seconds.toFixed(3) + "s";
        }
    }

    function snapResolutionPercent(value) {
        // AE's native render downsampling uses integer sample factors.
        // For this fast-cache workflow we expose the useful levels that
        // fall inside the requested 30-100% UI range:
        // Third ~= 33%, Half = 50%, Full = 100%.
        var points = [33, 50, 100];
        var v = Math.round(Number(value));
        var best = points[0];
        var bestDistance = Math.abs(v - best);

        for (var i = 1; i < points.length; i++) {
            var d = Math.abs(v - points[i]);
            if (d < bestDistance) {
                best = points[i];
                bestDistance = d;
            }
        }

        return best;
    }

    function resolutionTemplateValue(pct) {
        if (pct <= 33) return "Third";
        if (pct <= 50) return "Half";
        return "Full";
    }

    function renderProfileFor(comp, outputBase, renderMode) {
        var mode = draftCheck.value ? "DRAFT" : "FINAL";
        var pct = snapResolutionPercent(resolutionSlider.value);
        renderMode = renderMode || "PNG";
        var isPngMode = renderMode === "PARALLEL_PNG" ||
            renderMode === "PNG" || renderMode === "FAST_PNG";
        var includeAlpha = isPngMode && alphaCheck.value;
        var base = outputBase && String(outputBase).length ?
            safeName(outputBase) :
            safeName(comp.name);

        // The selected PNG sequence name is the filename template.
        // Example:
        //   W:\tutorials\1.2.1\
        //   -> 1.2.1_00001.png
        //   -> W:\tutorials\1.2.1.mp4
        //
        // Draft/reduced-resolution versions stay isolated.
        var profileBase =
            (mode === "FINAL" && pct === 100) ?
            base :
            base + "_" + mode + "_" + pct;

        // RGB and RGBA frames must never share one Skip Existing Files cache.
        // Keep the established alpha filenames unchanged; mark RGB-only cache.
        var cacheBase = profileBase;

        if (renderMode === "JPEG") {
            cacheBase += "_JPG";
        } else if (isPngMode && !includeAlpha) {
            cacheBase += "_RGB";
        }

        var movieBase = profileBase;

        return {
            mode: mode,
            pct: pct,
            quality: mode === "DRAFT" ? "Draft" : "Best",
            resolution: resolutionTemplateValue(pct),
            includeAlpha: includeAlpha,
            renderMode: renderMode,
            cacheBase: cacheBase,
            movieBase: movieBase
        };
    }

    function outputBaseFromProfileBase(cacheBase, qualityMode, resolutionPct) {
        var base = String(cacheBase || "Render");
        var mode = String(qualityMode || "FINAL");
        var pct = parseInt(resolutionPct || "100", 10);

        if (base.substr(base.length - 4).toUpperCase() === "_RGB") {
            base = base.substring(0, base.length - 4);
        }

        if (base.substr(base.length - 4).toUpperCase() === "_JPG") {
            base = base.substring(0, base.length - 4);
        }

        if (!(mode === "FINAL" && pct === 100)) {
            var suffix = "_" + mode + "_" + pct;
            if (base.substr(base.length - suffix.length) === suffix) {
                base = base.substring(0, base.length - suffix.length);
            }
        }

        return safeName(base);
    }

    function ensureSmartRenderTemplate(comp, baseTemplate, profile, resumable) {
        var rqItem = null;

        var templateName =
            "__SmartRender_" +
            (resumable ? "CACHE_" : "MOVIE_") +
            profile.mode + "_" +
            profile.resolution.toUpperCase();

        try {
            rqItem = app.project.renderQueue.items.add(comp);

            var templates = rqItem.templates;
            var exists = false;

            for (var i = 0; i < templates.length; i++) {
                if (String(templates[i]) === templateName) {
                    exists = true;
                    break;
                }
            }

            if (exists) {
                return templateName;
            }

            // Resumable modes start from Multi-Machine Settings so Skip Existing
            // Files remains enabled. Fast modes start from normal Best Settings,
            // which lets After Effects use its regular Multi-Frame Render path.
            rqItem.applyTemplate(baseTemplate);

            rqItem.setSetting("Quality", profile.quality);
            rqItem.setSetting("Resolution", profile.resolution);

            rqItem.saveAsTemplate(templateName);

            return templateName;

        } catch (err) {
            throw new Error(
                "Could not create Smart Render settings for " +
                profile.mode + " " + profile.pct + "%.\n\n" +
                err.toString()
            );
        } finally {
            try {
                if (rqItem) rqItem.remove();
            } catch (removeErr) {}
        }
    }

    // ScriptUI dialogs inherit After Effects' interface theme. Use these for
    // cache operations instead of Windows alert()/confirm() boxes, which flash
    // a bright white native dialog over the dark AE interface.
    function showCacheDialog(title, rows, note, actionLabel) {
        var dlg = new Window(
            "dialog",
            SCRIPT_NAME + "  \u2022  " + title,
            undefined,
            {closeButton: true}
        );

        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.spacing = 10;
        dlg.margins = 14;

        var heading = dlg.add("statictext", undefined, title);
        heading.characters = 42;

        try {
            heading.graphics.font = ScriptUI.newFont(
                heading.graphics.font.name,
                "BOLD",
                heading.graphics.font.size + 1
            );
        } catch (fontErr) {}

        var info = dlg.add("group");
        info.orientation = "column";
        info.alignChildren = ["fill", "top"];
        info.spacing = 4;

        for (var i = 0; i < rows.length; i++) {
            var row = info.add("group");
            row.orientation = "row";
            row.alignChildren = ["left", "center"];
            row.spacing = 8;

            var label = row.add("statictext", undefined, rows[i][0]);
            label.characters = 10;

            var value = row.add("statictext", undefined, rows[i][1]);
            value.characters = 34;
        }

        if (note && String(note).length) {
            var noteText = dlg.add("statictext", undefined, String(note));
            noteText.characters = 45;
        }

        var buttons = dlg.add("group");
        buttons.orientation = "row";
        buttons.alignment = ["right", "top"];
        buttons.spacing = 8;

        var accepted = false;
        var primary = null;

        if (actionLabel) {
            var cancel = buttons.add("button", undefined, "Cancel");
            primary = buttons.add("button", undefined, actionLabel);

            cancel.onClick = function() {
                accepted = false;
                dlg.close();
            };

            primary.onClick = function() {
                accepted = true;
                dlg.close();
            };

            dlg.cancelElement = cancel;
        } else {
            primary = buttons.add("button", undefined, "OK");
            primary.onClick = function() {
                accepted = true;
                dlg.close();
            };
        }

        dlg.defaultElement = primary;
        dlg.center();
        dlg.show();

        return accepted;
    }

    // ---------- UI ----------

    if (!isWindows()) {
        alert(SCRIPT_NAME + " v" + VERSION + "\n\nThis first version is Windows-only.");
        return;
    }

    var win = new Window("palette", SCRIPT_NAME + " v" + VERSION, undefined, {
        resizeable: false
    });

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 6;
    win.margins = 10;

    // All settings remain visible. Two calm sections provide hierarchy without
    // hiding controls or requiring tab switching.
    var compPanel = win.add("panel", undefined, "Composition");
    compPanel.orientation = "column";
    compPanel.alignChildren = ["fill", "top"];
    compPanel.spacing = 9;
    compPanel.margins = 10;

    var outPanel = win.add("panel", undefined, "Output");
    outPanel.orientation = "column";
    outPanel.alignChildren = ["fill", "top"];
    outPanel.spacing = 9;
    outPanel.margins = 10;

    // Create this row first so the destination remains the first output choice.
    var folderRow = outPanel.add("group");
    folderRow.orientation = "row";
    folderRow.alignChildren = ["fill", "center"];
    folderRow.spacing = 8;

    // Smart Render v1: each comp remembers its own output folder. This toggle
    // makes the File path retarget automatically when the active comp changes.
    var followRow = outPanel.add("group");
    followRow.orientation = "row";
    followRow.alignChildren = ["left", "center"];
    followRow.spacing = 8;
    var followSpacer = followRow.add("statictext", undefined, "");
    followSpacer.preferredSize.width = 58;
    var autoFollowCheck = followRow.add(
        "checkbox",
        undefined,
        "Auto-follow active comp"
    );
    autoFollowCheck.value = loadAutoFollowSetting();
    autoFollowCheck.helpTip =
        "Each comp remembers the output folder it was last rendered to, or last " +
        "picked with Choose. When on, switching the active Timeline composition " +
        "retargets the File path to that comp's remembered folder automatically. " +
        "When off, the path only changes when you press Refresh or Choose.";
    autoFollowCheck.onClick = function() {
        saveAutoFollowSetting(autoFollowCheck.value);
        if (autoFollowCheck.value) {
            lastFollowedCompKey = null;
            refreshUI();
        }
    };

    var compText = compPanel.add("statictext", undefined, "Comp: -");
    compText.characters = 46;

    var primaryRow = compPanel.add("group");
    primaryRow.orientation = "row";
    primaryRow.alignChildren = ["left", "center"];
    primaryRow.spacing = 8;
    var rangeLabel = primaryRow.add("statictext", undefined, "Range");
    rangeLabel.preferredSize.width = 58;
    var rangeDrop = primaryRow.add(
        "dropdownlist",
        undefined,
        ["Work Area", "Full Comp"]
    );
    rangeDrop.selection = 0;
    rangeDrop.onChange = function() {
        updateRenderButtonLabel();
    };

    var formatRow = outPanel.add("group");
    formatRow.orientation = "row";
    formatRow.alignChildren = ["left", "center"];
    formatRow.spacing = 9;
    var formatLabel = formatRow.add("statictext", undefined, "Format");
    formatLabel.preferredSize.width = 58;
    var renderModeDrop = formatRow.add("dropdownlist", undefined, [
        "Parallel PNG",
        "Fast MP4",
        "Native PNG",
        "Resumable JPEG",
        "Resumable PNG"
    ]);

    var savedRenderMode = loadRenderModeSetting();
    renderModeDrop.selection = savedRenderMode === "FAST_MP4" ? 1 :
        (savedRenderMode === "FAST_PNG" ? 2 :
        (savedRenderMode === "JPEG" ? 3 :
        (savedRenderMode === "PNG" ? 4 : 0)));
    renderModeDrop.helpTip =
        "Parallel PNG keeps valid cached PNGs, renders only missing ranges through temporary local TIFF chunks, then uses FFmpeg's threaded lossless PNG encoder.";

    function currentRenderMode() {
        if (!renderModeDrop.selection) return "PARALLEL_PNG";
        if (renderModeDrop.selection.index === 1) return "FAST_MP4";
        if (renderModeDrop.selection.index === 2) return "FAST_PNG";
        if (renderModeDrop.selection.index === 3) return "JPEG";
        if (renderModeDrop.selection.index === 4) return "PNG";
        return "PARALLEL_PNG";
    }

    var fileLabel = folderRow.add("statictext", undefined, "File");
    fileLabel.preferredSize.width = 58;

    var folderEdit = folderRow.add("edittext", undefined, "");
    folderEdit.characters = 34;
    folderEdit.readonly = true;
    folderEdit.helpTip =
        "Output name. Sequence modes use this base for numbered JPEG or PNG frames.";

    var browseFolderBtn = folderRow.add("button", undefined, "Choose");
    browseFolderBtn.preferredSize.width = 64;
    browseFolderBtn.helpTip =
        "Choose an output folder/name or select an existing numbered frame to resume its sequence.";

    var engineRow = compPanel.add("group");
    engineRow.orientation = "row";
    engineRow.alignChildren = ["left", "center"];
    engineRow.spacing = 8;
    var cpuLabel = engineRow.add("statictext", undefined, "CPU");
    cpuLabel.preferredSize.width = 58;
    var cpuDrop = engineRow.add("dropdownlist", undefined, [
        "100% Max",
        "85%",
        "70% Working",
        "50%"
    ]);
    cpuDrop.selection = 0;

    engineRow.add("statictext", undefined, "Resolution");
    var resolutionSlider = engineRow.add("slider", undefined, 100, 30, 100);
    resolutionSlider.preferredSize.width = 160;
    resolutionSlider.helpTip =
        "Snaps to After Effects' native 33%, 50%, or 100% render levels.";
    var resolutionText = engineRow.add("statictext", undefined, "100%");
    resolutionText.characters = 5;

    // Quality shares the Range row; both are frequently changed and fit
    // comfortably without adding another dense line.
    var qualityRow = primaryRow;
    var qualityLabel = qualityRow.add("statictext", undefined, "Quality");
    qualityLabel.preferredSize.width = 58;
    var draftCheck = qualityRow.add("checkbox", undefined, "Draft");
    draftCheck.value = false;
    draftCheck.helpTip =
        "Draft render quality for faster previews.";
    var finalCheck = qualityRow.add("checkbox", undefined, "Final");
    finalCheck.value = true;
    finalCheck.helpTip = "Best render quality for final output.";

    var alphaCheck = formatRow.add("checkbox", undefined, "Alpha");
    alphaCheck.value = loadAlphaSetting();
    alphaCheck.helpTip =
        "Checked: transparent RGBA PNG via _png_alpha_frame. Unchecked: RGB PNG via _png_sequence; cache filenames receive _RGB.";
    alphaCheck.onClick = function() {
        saveAlphaSetting(alphaCheck.value);
        updateRenderButtonLabel();
    };

    var incrementMp4Check = formatRow.add(
        "checkbox",
        undefined,
        "Increment MP4"
    );
    incrementMp4Check.value = loadIncrementMp4Setting();
    incrementMp4Check.helpTip =
        "Keep existing MP4 files. New outputs become name.1.mp4, name.2.mp4, and so on.";
    incrementMp4Check.onClick = function() {
        saveIncrementMp4Setting(incrementMp4Check.value);
        updateRenderButtonLabel();
    };

    // They look like checkboxes, but behave as one mutually exclusive switch.
    draftCheck.onClick = function() {
        draftCheck.value = true;
        finalCheck.value = false;
        updateRenderButtonLabel();
    };

    finalCheck.onClick = function() {
        finalCheck.value = true;
        draftCheck.value = false;
        updateRenderButtonLabel();
    };

    var mp4Row = outPanel.add("group");
    mp4Row.orientation = "row";
    mp4Row.alignChildren = ["left", "center"];
    mp4Row.spacing = 8;
    var mp4Label = mp4Row.add("statictext", undefined, "MP4 quality");
    mp4Label.preferredSize.width = 58;
    var crfHighText = mp4Row.add("statictext", undefined, "HIGH");
    crfHighText.helpTip = "Higher MP4 quality and a larger file.";

    var crfSlider = mp4Row.add(
        "slider",
        undefined,
        loadCrfSetting(),
        14,
        28
    );
    crfSlider.preferredSize.width = 175;
    crfSlider.helpTip =
        "H.264 CRF: lower means higher quality and a larger MP4. 18 is high quality.";

    var crfLowText = mp4Row.add("statictext", undefined, "LOW");
    crfLowText.helpTip = "Lower MP4 quality and a smaller file.";

    var crfText = mp4Row.add("statictext", undefined, "CRF 18");
    crfText.characters = 6;

    function updateResolutionUI(doSnap) {
        var pct = snapResolutionPercent(resolutionSlider.value);

        if (doSnap) {
            resolutionSlider.value = pct;
        }

        resolutionText.text = pct + "%";
        updateRenderButtonLabel();
    }

    resolutionSlider.onChanging = function() {
        updateResolutionUI(false);
    };

    resolutionSlider.onChange = function() {
        updateResolutionUI(true);
    };

    function updateCrfUI(doSnap) {
        var value = Math.max(
            14,
            Math.min(28, Math.round(Number(crfSlider.value)))
        );

        if (doSnap) {
            crfSlider.value = value;
            saveCrfSetting(value);
        }

        crfText.text = "CRF " + value;
        updateRenderButtonLabel();
    }

    crfSlider.onChanging = function() {
        updateCrfUI(false);
    };

    crfSlider.onChange = function() {
        updateCrfUI(true);
    };

    updateCrfUI(false);

    function updateRenderModeUI() {
        var mode = currentRenderMode();
        var active = !!$.global.__SMART_RENDER_FLOATING_STATE__;

        alphaCheck.enabled = !active &&
            (mode === "PARALLEL_PNG" ||
             mode === "PNG" || mode === "FAST_PNG");
        crfSlider.enabled = !active && mode !== "FAST_MP4";
        crfHighText.enabled = crfSlider.enabled;
        crfLowText.enabled = crfSlider.enabled;
        crfText.enabled = crfSlider.enabled;

        if (mode === "FAST_MP4") {
            crfText.text = "AE preset";
        } else {
            crfText.text = "CRF " + Math.round(Number(crfSlider.value));
        }

    }

    renderModeDrop.onChange = function() {
        saveRenderModeSetting(currentRenderMode());
        updateRenderModeUI();
        updateRenderButtonLabel();
    };

    updateRenderModeUI();

    // Keep the primary action short and visually dominant.
    var renderRow = win.add("group");
    renderRow.orientation = "row";
    renderRow.alignment = ["fill", "top"];
    renderRow.alignChildren = ["left", "center"];
    renderRow.spacing = 6;

    var renderBtn = renderRow.add("button", undefined, "RENDER");
    renderBtn.alignment = ["fill", "center"];
    renderBtn.preferredSize = [326, 36];

    var fixNamesBtn = renderRow.add("button", undefined, "Fix Names");
    fixNamesBtn.alignment = ["right", "center"];
    fixNamesBtn.preferredSize = [82, 36];
    fixNamesBtn.helpTip =
        "Rename the render sequence (and MP4) already in the output folder to " +
        "match the current naming style. If the folder holds more than one " +
        "sequence, a dialog lets you pick which to keep and optionally delete the rest.";

    var refreshCompBtn = renderRow.add("button", undefined, "Refresh");
    refreshCompBtn.alignment = ["right", "center"];
    refreshCompBtn.preferredSize = [78, 36];
    refreshCompBtn.helpTip =
        "Use the composition currently active in the After Effects Timeline.";

    // Secondary cache/file actions share one quiet utility row.
    var actionRow = win.add("group");
    actionRow.orientation = "row";
    actionRow.alignment = ["fill", "top"];
    actionRow.alignChildren = ["left", "center"];
    actionRow.spacing = 6;

    var deleteRangeBtn = actionRow.add("button", undefined, "Delete Work Area");
    deleteRangeBtn.preferredSize.width = 145;
    deleteRangeBtn.helpTip =
        "Deletes cached JPEG/PNG frames inside the active comp's current Work Area for all profiles.";

    var clearBtn = actionRow.add("button", undefined, "Clear All");
    clearBtn.preferredSize.width = 95;
    clearBtn.helpTip = "Deletes all cached JPEG and PNG frames for the active comp.";

    var actionSpacer = actionRow.add("statictext", undefined, "");
    actionSpacer.alignment = ["fill", "center"];

    var openOutputBtn = actionRow.add("button", undefined, "Output");
    openOutputBtn.preferredSize.width = 58;
    openOutputBtn.helpTip = "Open the selected output folder.";

    var openLogBtn = actionRow.add("button", undefined, "Log");
    openLogBtn.preferredSize.width = 44;
    openLogBtn.enabled = false;
    openLogBtn.helpTip = "Open the current render log.";

    var progressBar = win.add("progressbar", undefined, 0, 100);
    progressBar.preferredSize = [410, 12];
    progressBar.value = 0;

    function setProgressLineComplete(isComplete) {
        var color = isComplete ?
            [0.18, 0.78, 0.35, 1] :
            [0.27, 0.64, 0.96, 1];

        try {
            progressBar.graphics.foregroundColor =
                progressBar.graphics.newBrush(
                    progressBar.graphics.BrushType.SOLID_COLOR,
                    color
                );
            progressBar.notify("onDraw");
        } catch (colorErr) {}
    }

    setProgressLineComplete(false);

    // Compact footer: information stays left, time and utilities align right.
    var footerTop = win.add("group");
    footerTop.orientation = "row";
    footerTop.alignment = ["fill", "top"];
    footerTop.alignChildren = ["fill", "center"];
    footerTop.spacing = 8;

    var progressText = footerTop.add(
        "statictext",
        undefined,
        "0 / 0  \u2022  0%"
    );
    progressText.characters = 25;
    progressText.alignment = ["fill", "center"];

    var jobTimeText = footerTop.add(
        "statictext",
        undefined,
        "Time --:--  \u2022  ETA --:--",
        {justify: "right"}
    );
    jobTimeText.characters = 25;
    jobTimeText.alignment = ["right", "center"];

    var footerBottom = win.add("group");
    footerBottom.orientation = "row";
    footerBottom.alignment = ["fill", "top"];
    footerBottom.alignChildren = ["fill", "center"];
    footerBottom.spacing = 8;

    var statusText = footerBottom.add("statictext", undefined, "Ready.");
    statusText.characters = 22;
    statusText.alignment = ["fill", "center"];

    var footerButtons = footerBottom.add("group");
    footerButtons.orientation = "row";
    footerButtons.alignment = ["right", "center"];
    footerButtons.alignChildren = ["left", "center"];
    footerButtons.spacing = 4;

    var scanRenderBtn = footerButtons.add("button", undefined, "Scan Render");
    scanRenderBtn.preferredSize.width = 76;
    scanRenderBtn.helpTip =
        "Reconnect to the newest unfinished Smart Render for this project.";

    var forceEndBtn = footerButtons.add("button", undefined, "End Render");
    forceEndBtn.preferredSize.width = 74;
    forceEndBtn.enabled = false;
    forceEndBtn.helpTip =
        "Force-stop only the process tree launched by the active render.";

    // ---------- batch queue (collapsed by default) ----------

    // Each entry: { compId, compName, outputText, checked }. The panel settings
    // above (Format, Quality, Alpha, CRF, Resolution, Range) apply to every
    // item; a row only stores which comp, where it goes, and whether it runs.
    var batchItems = [];
    var batchExpanded = false;

    var batchToggleRow = win.add("group");
    batchToggleRow.orientation = "row";
    batchToggleRow.alignment = ["fill", "top"];
    batchToggleRow.alignChildren = ["left", "center"];
    batchToggleRow.spacing = 6;

    var batchToggleBtn = batchToggleRow.add(
        "button",
        undefined,
        "Show batch queue"
    );
    batchToggleBtn.preferredSize = [140, 24];
    batchToggleBtn.helpTip =
        "Show or hide the batch list. Renders several comps one after another, " +
        "each into its own folder, using the settings shown above.";

    var batchToggleHint = batchToggleRow.add(
        "statictext",
        undefined,
        ""
    );
    batchToggleHint.alignment = ["fill", "center"];

    // Named saved lists for this project: { "name": [items], ... }
    var batchLists = {};

    // The queue is its own floating palette docked to the right of the main
    // window, so a long list never stretches the main UI.
    var batchWin = new Window(
        "palette",
        SCRIPT_NAME + " v" + VERSION + " - batch queue",
        undefined,
        { resizeable: false }
    );
    batchWin.orientation = "column";
    batchWin.alignChildren = ["fill", "top"];
    batchWin.spacing = 6;
    batchWin.margins = 12;

    var batchSavedRow = batchWin.add("group");
    batchSavedRow.orientation = "row";
    batchSavedRow.alignChildren = ["left", "center"];
    batchSavedRow.spacing = 4;

    batchSavedRow.add("statictext", undefined, "Saved list:");

    var listDrop = batchSavedRow.add("dropdownlist", undefined, []);
    listDrop.preferredSize.width = 200;
    listDrop.helpTip = "Pick a saved list, then Load it into the queue below.";

    var batchListLoadBtn = batchSavedRow.add("button", undefined, "Load");
    batchListLoadBtn.preferredSize.width = 52;
    batchListLoadBtn.helpTip = "Replace the queue with the selected saved list.";

    var batchListSaveBtn = batchSavedRow.add("button", undefined, "Save as...");
    batchListSaveBtn.preferredSize.width = 72;
    batchListSaveBtn.helpTip =
        "Save the current queue as a named list (updates it if the name exists).";

    var batchListDeleteBtn = batchSavedRow.add("button", undefined, "Delete");
    batchListDeleteBtn.preferredSize.width = 58;
    batchListDeleteBtn.helpTip = "Delete the selected saved list.";

    var batchAddRow = batchWin.add("group");
    batchAddRow.orientation = "row";
    batchAddRow.alignChildren = ["left", "center"];
    batchAddRow.spacing = 4;

    var batchAddBtn = batchAddRow.add("button", undefined, "Add active comp");
    batchAddBtn.preferredSize.width = 118;
    batchAddBtn.helpTip =
        "Add the composition active in the Timeline, with the File path shown in the main window.";

    var batchAddSpacer = batchAddRow.add("statictext", undefined, "");
    batchAddSpacer.alignment = ["fill", "center"];

    var batchNewBtn = batchAddRow.add("button", undefined, "Empty queue");
    batchNewBtn.preferredSize.width = 92;
    batchNewBtn.helpTip = "Remove every comp from the current queue.";

    // One control row per comp is stacked here - no list box.
    var batchRowsGroup = batchWin.add("group");
    batchRowsGroup.orientation = "column";
    batchRowsGroup.alignChildren = ["left", "top"];
    batchRowsGroup.spacing = 3;
    batchRowsGroup.alignment = ["fill", "top"];

    var batchMidRow = batchWin.add("group");
    batchMidRow.orientation = "row";
    batchMidRow.alignChildren = ["left", "center"];
    batchMidRow.spacing = 4;

    var batchAllBtn = batchMidRow.add("button", undefined, "Check all");
    batchAllBtn.preferredSize.width = 66;
    batchAllBtn.helpTip = "Check every comp.";

    var batchNoneBtn = batchMidRow.add("button", undefined, "Uncheck all");
    batchNoneBtn.preferredSize.width = 80;
    batchNoneBtn.helpTip = "Uncheck every comp.";

    var batchMidSpacer = batchMidRow.add("statictext", undefined, "");
    batchMidSpacer.alignment = ["fill", "center"];

    var stopOnErrorCheck = batchMidRow.add(
        "checkbox",
        undefined,
        "Stop on error"
    );
    stopOnErrorCheck.value = loadStopOnErrorSetting();
    stopOnErrorCheck.helpTip =
        "On: a failed comp halts the batch. Off: skip it and keep going, then " +
        "report which comps failed.";
    stopOnErrorCheck.onClick = function() {
        saveStopOnErrorSetting(stopOnErrorCheck.value);
    };

    var batchRunBtn = batchWin.add("button", undefined, "RENDER CHECKED");
    batchRunBtn.preferredSize = [500, 32];
    batchRunBtn.helpTip =
        "Render every checked comp, one after another. The next render starts " +
        "only when the previous one has finished.";

    var batchCountText = batchWin.add("statictext", undefined, "");
    batchCountText.alignment = ["fill", "center"];

    function positionBatchWin() {
        try {
            batchWin.location = [
                Math.max(0, win.location[0] + win.size[0] + 8),
                Math.max(0, win.location[1])
            ];
        } catch (e) {}
    }

    function relayoutBatchWindow() {
        try {
            batchWin.layout.layout(true);
            batchWin.layout.layout(true);
            batchWin.layout.resize();
            batchWin.size = [batchWin.size[0], batchWin.preferredSize[1]];
        } catch (e) {}
    }

    function setBatchExpanded(show) {
        batchExpanded = !!show;
        batchToggleBtn.text = batchExpanded ?
            "Hide batch queue" :
            "Show batch queue";

        if (batchExpanded) {
            positionBatchWin();
            relayoutBatchWindow();
            try { batchWin.show(); } catch (e) {}
        } else {
            try { batchWin.hide(); } catch (e) {}
        }
    }

    batchWin.onClose = function() {
        batchExpanded = false;
        batchToggleBtn.text = "Show batch queue";
        try { updateBatchButtons(); } catch (e) {}
        return true;
    };

    listDrop.onChange = function() {
        try { updateBatchButtons(); } catch (e) {}
    };

    batchToggleBtn.onClick = function() {
        setBatchExpanded(!batchExpanded);
    };

    batchAddBtn.onClick = function() {
        batchAddActiveComp();
    };

    batchNewBtn.onClick = function() {
        if (batchBusy()) return;
        if (!batchItems.length) return;
        if (!confirm("Remove all " + batchItems.length +
            " comp(s) from the queue?")) return;
        batchItems = [];
        rebuildBatchRows();
    };

    batchListLoadBtn.onClick = function() {
        batchLoadNamedList();
    };

    batchListSaveBtn.onClick = function() {
        batchSaveNamedList();
    };

    batchListDeleteBtn.onClick = function() {
        batchDeleteNamedList();
    };

    batchAllBtn.onClick = function() {
        batchSetAllChecked(true);
    };

    batchNoneBtn.onClick = function() {
        batchSetAllChecked(false);
    };

    batchRunBtn.onClick = function() {
        startBatchRun();
    };

    // Polling still records the job label for recovery/failure logic, but the
    // dedicated Job panel is intentionally removed from the compact UI.
    var activeJobText = {text: ""};

    var lastLogPath = "";
    var activeBaseName = "";

    // Identity of the comp the Auto-follow toggle last retargeted the output to.
    var lastFollowedCompKey = null;

    // ---------- UI refresh ----------

    function compactButtonName(name, maxChars) {
        var text = String(name || "Comp");

        if (text.length <= maxChars) return text;
        return text.substring(0, Math.max(1, maxChars - 3)) + "...";
    }

    function formatJobDuration(totalSeconds) {
        totalSeconds = Math.max(0, Math.round(totalSeconds || 0));

        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        if (hours > 0) {
            return hours + ":" + pad2(minutes) + ":" + pad2(seconds);
        }

        return pad2(minutes) + ":" + pad2(seconds);
    }

    function updateJobClock(state, readyFrames, finishingLabel) {
        if (!state || !state.jobTimeText) return;

        var nowMs = new Date().getTime();
        var elapsed = Math.max(
            0,
            (nowMs - state.startTimeMs) / 1000
        );
        var etaText = "calculating...";

        if (finishingLabel) {
            etaText = finishingLabel;
        } else if (state.framesToRender <= 0) {
            etaText = "verifying...";
        } else {
            var writtenNow = Math.max(
                0,
                readyFrames - state.initialCached
            );
            var remaining = Math.max(
                0,
                state.framesToRender - writtenNow
            );

            if (writtenNow > 0 && !state.rateStartTimeMs) {
                state.rateStartTimeMs = nowMs;
                state.rateStartReadyFrames = readyFrames;
            }

            var sampleFrames = state.rateStartTimeMs ?
                Math.max(0, readyFrames - state.rateStartReadyFrames) : 0;
            var sampleSeconds = state.rateStartTimeMs ?
                Math.max(0, (nowMs - state.rateStartTimeMs) / 1000) : 0;

            if (remaining <= 0) {
                etaText = "00:00";
            } else if (sampleFrames >= 15 && sampleSeconds >= 8) {
                var framesPerSecond = sampleFrames / sampleSeconds;

                if (framesPerSecond > 0) {
                    etaText = "~" + formatJobDuration(
                        Math.ceil(remaining / framesPerSecond)
                    );
                }
            }
        }

        state.jobTimeText.text =
            "Time " + formatJobDuration(elapsed) +
            "  \u2022  ETA " + etaText;
    }

    function enableRenderControls(state) {
        if (!state) return;

        state.button.enabled = true;
        refreshCompBtn.enabled = true;
        state.deleteRangeButton.enabled = true;
        state.clearButton.enabled = true;
        state.draftCheck.enabled = true;
        state.finalCheck.enabled = true;
        state.resolutionSlider.enabled = true;

        if (state.renderModeDrop) {
            state.renderModeDrop.enabled = true;
        }

        if (state.alphaCheck) {
            state.alphaCheck.enabled = true;
        }

        if (state.crfSlider) {
            state.crfSlider.enabled = true;
        }

        if (state.incrementMp4Check) {
            state.incrementMp4Check.enabled = true;
        }

        if (state.forceEndButton) {
            state.forceEndButton.enabled = false;
        }

        if (state.scanRenderButton) {
            state.scanRenderButton.enabled = true;
        }

        updateRenderModeUI();
    }

    // ---------- batch queue engine ----------

    function batchActive() {
        return !!$.global.__SMART_RENDER_BATCH__;
    }

    function shortOutputDir(outputText) {
        var t = String(outputText || "");
        t = t.replace(/[\/\\][^\/\\]*$/, "");

        if (t.length <= 44) return t;

        var parts = t.split(/[\/\\]/);
        if (parts.length >= 2) {
            return "...\\" + parts[parts.length - 2] +
                "\\" + parts[parts.length - 1];
        }

        return "..." + t.substring(t.length - 42);
    }

    function batchBusy() {
        return !!$.global.__SMART_RENDER_FLOATING_STATE__ || batchActive();
    }

    // Rebuilt every time the list changes: one entry per visible comp row.
    var batchRowRefs = [];

    function clearBatchRows() {
        batchRowRefs = [];
        while (batchRowsGroup.children.length > 0) {
            batchRowsGroup.remove(
                batchRowsGroup.children[batchRowsGroup.children.length - 1]
            );
        }
    }

    function addBatchRow(item) {
        var comp = findCompByIdOrName(item.compId, item.compName);
        var missing = !comp;
        if (missing) item.checked = false;

        var row = batchRowsGroup.add("group");
        row.orientation = "row";
        row.alignChildren = ["left", "center"];
        row.spacing = 6;
        row.alignment = ["fill", "top"];

        var cb = row.add("checkbox", undefined, "");
        cb.value = !!item.checked;
        cb.preferredSize.width = 18;
        cb.onClick = (function(it, box) {
            return function() {
                it.checked = box.value;
                updateBatchButtons();
                persistBatch();
            };
        })(item, cb);

        var nameTxt = row.add("statictext", undefined,
            compactButtonName(item.compName, 26) +
            (missing ? "  (missing)" : ""));
        nameTxt.preferredSize.width = 158;
        nameTxt.helpTip = item.compName +
            (missing ? "  -  not found in this project" : "");

        var pathTxt = row.add("statictext", undefined,
            shortOutputDir(item.outputText));
        pathTxt.preferredSize.width = 228;
        pathTxt.helpTip = item.outputText;

        var folderBtn = row.add("button", undefined, "Folder");
        folderBtn.preferredSize.width = 58;
        folderBtn.helpTip = "Set the output folder / name for this comp.";
        folderBtn.onClick = (function(it) {
            return function() { batchSetFolderForItem(it); };
        })(item);

        var removeBtn = row.add("button", undefined, "X");
        removeBtn.preferredSize.width = 26;
        removeBtn.helpTip = "Remove this comp from the list.";
        removeBtn.onClick = (function(it) {
            return function() { batchRemoveItem(it); };
        })(item);

        batchRowRefs.push({
            cb: cb,
            folderBtn: folderBtn,
            removeBtn: removeBtn
        });
    }

    function rebuildBatchRows() {
        clearBatchRows();

        if (!batchItems.length) {
            var empty = batchRowsGroup.add("statictext", undefined,
                "No comps yet  -  click \"Add active comp\" above.");
            empty.alignment = ["left", "top"];
        } else {
            for (var i = 0; i < batchItems.length; i++) {
                addBatchRow(batchItems[i]);
            }
        }

        updateBatchButtons();
        persistBatch();
        if (batchExpanded) relayoutBatchWindow();
    }

    function updateBatchButtons() {
        var busy = batchBusy();
        var running = batchActive();
        var hasProject = !!app.project.file;
        var hasItems = batchItems.length > 0;
        var hasSavedSel = false;
        try {
            hasSavedSel = !!(listDrop.selection &&
                batchLists.hasOwnProperty(listDrop.selection.text));
        } catch (selErr) {}

        batchToggleBtn.enabled = !running;
        batchAddBtn.enabled = !busy;
        batchNewBtn.enabled = !busy && hasItems;
        batchAllBtn.enabled = !busy && hasItems;
        batchNoneBtn.enabled = !busy && hasItems;
        listDrop.enabled = !busy;
        batchListLoadBtn.enabled = !busy && hasSavedSel;
        batchListSaveBtn.enabled = !busy && hasProject && hasItems;
        batchListDeleteBtn.enabled = !busy && hasSavedSel;
        stopOnErrorCheck.enabled = !running;
        batchRunBtn.enabled = !busy && hasItems;
        batchRunBtn.text = running ? "BATCH RUNNING..." : "RENDER CHECKED";

        for (var r = 0; r < batchRowRefs.length; r++) {
            batchRowRefs[r].cb.enabled = !busy;
            batchRowRefs[r].folderBtn.enabled = !busy;
            batchRowRefs[r].removeBtn.enabled = !busy;
        }

        var checked = 0;
        for (var i = 0; i < batchItems.length; i++) {
            if (batchItems[i].checked) checked++;
        }
        batchToggleHint.text = hasItems ?
            (checked + " / " + batchItems.length + " checked") :
            "";
    }

    function batchAddActiveComp() {
        if (batchBusy()) return;

        var comp = getActiveComp();
        if (!comp) {
            statusText.text = "Open a composition to add it.";
            return;
        }

        if (!app.project.file) {
            alert("Save the After Effects project first.");
            return;
        }

        for (var i = 0; i < batchItems.length; i++) {
            var same = false;
            try {
                same = (batchItems[i].compId === comp.id);
            } catch (e) {}

            if (same || batchItems[i].compName === comp.name) {
                statusText.text = "\"" +
                    compactButtonName(comp.name, 22) +
                    "\" is already in the list.";
                return;
            }
        }

        var outText = folderEdit.text;
        if (!outText || !outText.length) {
            var tpl = loadOutputTemplate(comp, false) ||
                deriveSiblingTemplate(comp) ||
                makeOutputTemplate(
                    defaultOutputFolder(comp),
                    safeName(comp.name)
                );
            outText = tpl.fsName;
        } else {
            outText = parseOutputSelection(outText, comp).templateFile.fsName;
        }

        var compId = null;
        try { compId = comp.id; } catch (idErr) {}

        batchItems.push({
            compId: compId,
            compName: comp.name,
            outputText: outText,
            checked: true
        });

        rebuildBatchRows();
        statusText.text = "Added " + compactButtonName(comp.name, 26);
    }

    function batchRemoveItem(item) {
        if (batchBusy()) return;

        for (var i = 0; i < batchItems.length; i++) {
            if (batchItems[i] === item) {
                batchItems.splice(i, 1);
                break;
            }
        }

        rebuildBatchRows();
    }

    function batchSetFolderForItem(item) {
        if (batchBusy()) return;

        var comp = findCompByIdOrName(item.compId, item.compName);
        var seed = null;
        try {
            seed = parseOutputSelection(item.outputText, comp).templateFile;
        } catch (e) {}

        var picked = modernPngSequenceDialog(
            "Choose output for " + item.compName,
            seed
        );

        if (picked) {
            item.outputText = picked.fsName;
            rebuildBatchRows();
            statusText.text =
                "Folder set for " + compactButtonName(item.compName, 22);
        }
    }

    function batchSetAllChecked(value) {
        if (batchBusy()) return;

        for (var i = 0; i < batchItems.length; i++) {
            batchItems[i].checked = value ? true : false;
        }

        rebuildBatchRows();
    }

    // Write the whole doc: the current working queue plus every named list.
    // Called after every change so the queue is retained across sessions.
    function persistBatch() {
        var file = batchSidecarFile();
        if (!file) return;

        try {
            writeTextFile(file, serializeBatchDoc(batchItems, batchLists));
        } catch (e) {}
    }

    function refreshListDropdown(selectName) {
        var names = [];
        for (var k in batchLists) {
            if (batchLists.hasOwnProperty(k)) names.push(k);
        }
        names.sort();

        listDrop.removeAll();
        if (!names.length) {
            var none = listDrop.add("item", "(no saved lists)");
            none.enabled = false;
        } else {
            for (var i = 0; i < names.length; i++) {
                listDrop.add("item", names[i]);
            }
            var want = -1;
            for (var j = 0; j < names.length; j++) {
                if (names[j] === selectName) { want = j; break; }
            }
            listDrop.selection = want >= 0 ? want : 0;
        }

        updateBatchButtons();
    }

    function selectedListName() {
        if (!listDrop.selection) return null;
        var name = listDrop.selection.text;
        return batchLists.hasOwnProperty(name) ? name : null;
    }

    function batchSaveNamedList() {
        if (batchBusy()) return;

        if (!batchItems.length) {
            statusText.text = "Nothing in the queue to save.";
            return;
        }

        var suggested = selectedListName() || "";
        var name = prompt("Save the current queue as:", suggested);
        if (name === null) return;

        name = String(name).replace(/^\s+|\s+$/g, "");
        if (!name.length) return;

        if (batchLists.hasOwnProperty(name) &&
            !confirm("A saved list named \"" + name +
                "\" already exists. Replace it?")) {
            return;
        }

        batchLists[name] = cloneBatchItems(batchItems);
        persistBatch();
        refreshListDropdown(name);
        statusText.text = "Saved list \"" + name + "\" (" +
            batchItems.length + " items).";
    }

    function batchLoadNamedList() {
        if (batchBusy()) return;

        var name = selectedListName();
        if (!name) {
            statusText.text = "Pick a saved list first.";
            return;
        }

        batchItems = cloneBatchItems(batchLists[name]);
        rebuildBatchRows();
        statusText.text = "Loaded \"" + name + "\" (" +
            batchItems.length + " items).";
    }

    function batchDeleteNamedList() {
        if (batchBusy()) return;

        var name = selectedListName();
        if (!name) return;

        if (!confirm("Delete the saved list \"" + name + "\"?\n\n" +
            "The current queue is not affected.")) {
            return;
        }

        delete batchLists[name];
        persistBatch();
        refreshListDropdown();
        statusText.text = "Deleted saved list \"" + name + "\".";
    }

    // Startup: pull the retained working queue and every named list.
    function loadBatchDocAtStartup() {
        var file = batchSidecarFile();
        var migrated = false;
        var text = "";

        if (file && file.exists) {
            text = readTextFile(file);
        } else {
            var legacy = legacyBatchSidecarFile();
            if (legacy && legacy.exists) {
                text = readTextFile(legacy);
                migrated = true;
            }
        }

        var doc = parseBatchDoc(text);
        batchItems = doc.current || [];
        batchLists = doc.lists || {};
        refreshListDropdown();

        // Write the fixed-name file once so future .aep increments keep the list.
        if (migrated) persistBatch();
    }

    function startBatchRun() {
        if (batchActive()) {
            statusText.text = "Batch already running.";
            return;
        }

        if ($.global.__SMART_RENDER_FLOATING_STATE__) {
            alert("A render is already running. Wait for it to finish.");
            return;
        }

        if (!app.project.file) {
            alert("Save the After Effects project first.");
            return;
        }

        if (findRunningSmartRenderJob()) {
            alert(
                "A Smart Render job is already running.\n\n" +
                "End it before starting a batch."
            );
            return;
        }

        var queue = [];
        for (var i = 0; i < batchItems.length; i++) {
            if (batchItems[i].checked) queue.push(batchItems[i]);
        }

        if (!queue.length) {
            statusText.text = "Check at least one comp to render.";
            return;
        }

        var missing = [];
        for (i = 0; i < queue.length; i++) {
            if (!findCompByIdOrName(queue[i].compId, queue[i].compName)) {
                missing.push(queue[i].compName);
            }
        }

        var warn = missing.length ?
            ("\n\n" + missing.length +
                " checked comp(s) can't be found and will be skipped:\n- " +
                missing.join("\n- ")) :
            "";

        if (!confirm(
            "Render " + queue.length + " comp(s), one after another?\n\n" +
            "Format: " + renderModeDrop.selection.text +
            "    Quality: " + (draftCheck.value ? "Draft" : "Final") +
            "    Range: " + rangeDrop.selection.text + "\n" +
            "Stop on first error: " + (stopOnErrorCheck.value ? "yes" : "no") +
            warn
        )) {
            return;
        }

        var frozen = [];
        for (i = 0; i < queue.length; i++) {
            frozen.push({
                compId: queue[i].compId,
                compName: queue[i].compName,
                outputText: queue[i].outputText
            });
        }

        $.global.__SMART_RENDER_BATCH__ = {
            queue: frozen,
            pos: 0,
            total: frozen.length,
            results: [],
            failNames: [],
            stopOnError: stopOnErrorCheck.value,
            startedMs: new Date().getTime()
        };

        if (!batchExpanded) setBatchExpanded(true);
        setProgressLineComplete(false);
        batchCountText.text = "Batch starting...";
        updateBatchButtons();
        refreshUI();
        startNextBatchItem();
    }

    function startNextBatchItem() {
        var b = $.global.__SMART_RENDER_BATCH__;
        if (!b) return;

        while (b.pos < b.queue.length) {
            var entry = b.queue[b.pos];
            b.pos++;

            batchCountText.text = "Batch " + b.pos + " / " + b.total +
                "  -  " + compactButtonName(entry.compName, 28);

            var comp = findCompByIdOrName(entry.compId, entry.compName);

            if (!comp) {
                b.results.push("skip");
                b.failNames.push(entry.compName + " (not found)");
                if (b.stopOnError) {
                    finishBatch("stopped - " + entry.compName + " not found");
                    return;
                }
                continue;
            }

            var startErrText = "";
            try {
                startSmartRender(comp, entry.outputText, true);
            } catch (startErr) {
                startErrText = " (" + startErr.toString() + ")";
            }

            if ($.global.__SMART_RENDER_FLOATING_STATE__) {
                $.global.__SMART_RENDER_FLOATING_STATE__.batchOwned = true;
                statusText.text =
                    "Batch " + b.pos + "/" + b.total + "  -  starting";
                return;
            }

            // startSmartRender bailed before launching (missing template,
            // FFmpeg, output folder, project save, ...). Its own alert already
            // explained why, unless it threw.
            b.results.push("fail");
            b.failNames.push(comp.name +
                (startErrText || " (could not start)"));
            if (b.stopOnError) {
                finishBatch("stopped - " + comp.name + " could not start");
                return;
            }
        }

        finishBatch("done");
    }

    // Called by the poller (and End Render) at every terminal job state.
    // outcome: "ok" | "fail" | "cancel". Returns true when a batch consumed it.
    function batchAdvanceAfterItem(outcome) {
        var b = $.global.__SMART_RENDER_BATCH__;
        if (!b) return false;

        if (outcome === "cancel") {
            b.results.push("cancel");
            finishBatch("cancelled");
            return true;
        }

        b.results.push(outcome);

        if (outcome === "fail") {
            var name = b.queue[b.pos - 1] ?
                b.queue[b.pos - 1].compName :
                "a comp";
            b.failNames.push(name + " (render failed)");
            if (b.stopOnError) {
                finishBatch("stopped - " + name + " failed");
                return true;
            }
        }

        startNextBatchItem();
        return true;
    }

    function finishBatch(reasonText) {
        var b = $.global.__SMART_RENDER_BATCH__;
        $.global.__SMART_RENDER_BATCH__ = null;
        if (!b) return;

        var ok = 0, k;
        for (k = 0; k < b.results.length; k++) {
            if (b.results[k] === "ok") ok++;
        }

        var failed = b.failNames.length;
        var elapsed = Math.max(
            0,
            (new Date().getTime() - b.startedMs) / 1000
        );

        batchCountText.text =
            "Batch " + reasonText + "  -  " + ok + "/" + b.total + " ok" +
            (failed ? ", " + failed + " failed" : "") +
            "  -  " + formatJobDuration(elapsed);

        statusText.text = failed ?
            ("Batch finished  -  " + failed + " failed") :
            ("Batch finished  -  " + ok + " rendered");

        if (failed) {
            alert(
                "Batch " + reasonText + ".\n\n" +
                ok + " of " + b.total + " rendered.\n\n" +
                "Not completed:\n- " + b.failNames.join("\n- ")
            );
        }

        updateBatchButtons();
        refreshUI();
    }

    function updateRenderButtonLabel(compOverride) {
        if (!renderBtn) return;

        var comp = compOverride || getActiveComp();

        if (!comp) {
            renderBtn.text = "SELECT A COMPOSITION";
            renderBtn.helpTip = "Open or select an After Effects composition first.";
            return;
        }

        var rangeLabel =
            rangeDrop.selection && rangeDrop.selection.index === 1 ?
            "FULL COMP" :
            "WORK AREA";

        var modeLabel = draftCheck.value ? "DRAFT" : "FINAL";
        var renderMode = currentRenderMode();
        var formatLabel = renderMode === "PARALLEL_PNG" ? "PNG PARALLEL" :
            (renderMode === "FAST_MP4" ? "FAST MP4" :
            (renderMode === "FAST_PNG" ? "PNG FAST" :
            (renderMode === "JPEG" ? "JPEG RESUME" : "PNG RESUME")));
        var pct = snapResolutionPercent(resolutionSlider.value);
        var crf = Math.round(Number(crfSlider.value));
        var channelLabel =
            (renderMode === "PARALLEL_PNG" ||
             renderMode === "PNG" || renderMode === "FAST_PNG") &&
            alphaCheck.value ?
            "RGBA" : "RGB";
        var compLabel = compactButtonName(comp.name, 48);
        var outputLabel = "CHOOSE PNG OUTPUT";

        try {
            if (folderEdit.text.length) {
                var selection = parseOutputSelection(folderEdit.text, comp);
                var movieFolder = getMovieFolderForOutput(
                    selection.folder,
                    selection.baseName,
                    renderMode === "FAST_MP4"
                );
                var previewProfile = renderProfileFor(
                    comp,
                    selection.baseName,
                    renderMode
                );
                var previewChoice = chooseMp4Output(
                    movieFolder,
                    previewProfile.movieBase,
                    incrementMp4Check.value
                );

                outputLabel =
                    previewChoice.fileName;
            }
        } catch (outputPreviewErr) {}

        renderBtn.text = "RENDER  \u2022  " + compLabel;

        renderBtn.helpTip =
            comp.name + " - " + rangeLabel + " - " + modeLabel + " " +
            pct + "% - " + formatLabel + " - " + channelLabel +
            " - " + outputLabel +
            (renderMode === "FAST_MP4" ?
                " - native H.264 + audio." :
                " - H.264 + AAC at CRF " + crf + ".");
    }

    forceEndBtn.onClick = function() {
        var state = $.global.__SMART_RENDER_FLOATING_STATE__;

        if (!state) {
            forceEndBtn.enabled = false;
            activeJobText.text = "Job: none";
            return;
        }

        var doneFile = new File(state.donePath);
        if (doneFile.exists) {
            $.global.__smartRenderFloatingPoll();
            return;
        }

        var rootPids = readPidList(state.processIdPath || "");
        var workerPids = readPidList(state.workerIdPath || "");
        var discoveredPids = discoverJobAfterFxPids(state);
        for (var d = 0; d < discoveredPids.length; d++) {
            var duplicate = false;
            for (var w = 0; w < workerPids.length; w++) {
                if (workerPids[w] === discoveredPids[d]) {
                    duplicate = true;
                    break;
                }
            }
            if (!duplicate) workerPids.push(discoveredPids[d]);
        }

        if (!confirm(
            (batchActive() ?
                "Force-end the batch?\n\nThe current comp and the rest of the queue will stop.\n\n" :
                "Force-end this Smart Render job?\n\n") +
            state.jobCompName +
            "\n\nThe current render operation will stop."
        )) {
            return;
        }

        var cancelFile = new File(state.cancelPath);

        try {
            writeTextFile(cancelFile, "cancelled");
        } catch (cancelWriteErr) {
            alert("Could not mark the job for cancellation.");
            return;
        }

        var allStopped = true;
        var i;

        // AE 2026 can detach AfterFX.com from aerender/cmd. Stop those real
        // workers first, then stop the wrapper/verifier process tree.
        for (i = 0; i < workerPids.length; i++) {
            if (!stopTrackedProcess(workerPids[i], "AfterFX.com", true)) {
                allStopped = false;
            }
        }

        for (i = 0; i < rootPids.length; i++) {
            if (!stopTrackedProcess(rootPids[i], "cmd", true)) {
                allStopped = false;
            }
        }

        if (!allStopped) {
            alert(
                "Some render processes could not be ended.\n\n" +
                "The job remains marked cancelled. Check Task Manager or Open Log."
            );
            return;
        }

        var elapsed = Math.max(
            0,
            (new Date().getTime() - state.startTimeMs) / 1000
        );

        state.status.text = "Render ended.";
        state.activeJobText.text =
            "Last: " + state.jobCompName + "  \u2022  ENDED";
        state.jobTimeText.text =
            "Ended after " + formatJobDuration(elapsed);

        removeJobManifest(state.manifestPath);
        $.global.__SMART_RENDER_FLOATING_STATE__ = null;

        if (batchActive()) {
            finishBatch("cancelled");
        } else {
            enableRenderControls(state);
        }

        updateRenderButtonLabel();
    };

    scanRenderBtn.onClick = function() {
        if ($.global.__SMART_RENDER_FLOATING_STATE__) {
            alert("Smart Render is already tracking an active render.");
            return;
        }

        if (!app.project.file) {
            alert("Open and save the After Effects project first.");
            return;
        }

        scanRenderBtn.enabled = false;
        setProgressLineComplete(false);
        activeJobText.text = "Job: scanning...";
        jobTimeText.text = "Scanning...";
        statusText.text = "Finding active render...";

        var found = null;
        var connected = false;

        try {
            found = findNewestActiveJobManifest();
            connected = found ? connectToScannedJob(found) : false;
        } catch (scanErr) {
            statusText.text = "Could not scan render jobs.";
            alert(
                "Could not scan active Smart Render jobs.\n\n" +
                scanErr.toString()
            );
        }

        if (!connected) {
            activeJobText.text = "Job: none found";
            jobTimeText.text = "No active render";
            if (!found) {
                statusText.text = "Ready.";
            }
            scanRenderBtn.enabled = true;
        }
    };

    // Stable identity for the active comp, used to notice comp switches.
    function compFollowKey(comp) {
        if (!comp) return null;

        var key = outputSettingKey(comp);
        if (key) return key;

        try {
            return "id:" + String(comp.id);
        } catch (e) {}

        return "name:" + safeName(comp.name);
    }

    // The output FOLDER is remembered per comp; the sequence NAME is always the
    // comp name (so "1.3.2 Activations & Checks" -> "1.3.2 Activations & Checks_.png",
    // and Increment MP4 makes "..._1.mp4", "..._2.mp4"). Never fall back to
    // another comp's global "last used" path here.
    function applyCompOutput(comp) {
        var saved = loadOutputTemplate(comp, false);

        if (saved && templateLooksMisassigned(saved, comp)) {
            saved = null;
        }

        var folder;
        if (saved) {
            folder = saved.parent;
        } else {
            var derived = deriveSiblingTemplate(comp);
            folder = derived ? derived.parent : defaultOutputFolder(comp);
        }

        // The sequence name is always the comp name - no exceptions. An older
        // differently-named cache in the folder is simply ignored; re-render or
        // use Choose -> pick the old .mp4 if you want to resume it.
        var template = makeOutputTemplate(folder, safeName(comp.name));
        folderEdit.text = template.fsName;
        activeBaseName = sequenceBaseFromFileName(template.name);
    }

    function refreshSelectedComp() {
        if ($.global.__SMART_RENDER_FLOATING_STATE__) {
            statusText.text = "A render is already active.";
            return;
        }

        var selectedComp = getActiveComp();

        if (!selectedComp) {
            compText.text = "Comp: select a Timeline composition";
            statusText.text = "Select a composition, then Refresh.";
            renderBtn.enabled = false;
            return;
        }

        forgetSequenceBaseCache();
        applyCompOutput(selectedComp);
        lastFollowedCompKey = compFollowKey(selectedComp);
        refreshUI();
        statusText.text =
            "Selected  \u2022  " + compactButtonName(selectedComp.name, 38);
    }

    refreshCompBtn.onClick = function() {
        refreshSelectedComp();
    };

    function refreshUI() {
        var comp = getActiveComp();

        if (!comp) {
            compText.text = "Comp: select a composition";
            updateRenderButtonLabel(null);
            renderBtn.enabled = false;
            fixNamesBtn.enabled = false;
            refreshCompBtn.enabled = true;
            deleteRangeBtn.enabled = false;
            clearBtn.enabled = false;
            return;
        }

        compText.text = comp.name + "  \u2022  " +
            comp.width + "x" + comp.height + "  \u2022  " +
            fpsString(comp) + " fps";
        updateRenderButtonLabel(comp);

        // Auto-follow: when the active comp changes, retarget the output to
        // that comp's remembered folder. Never disturb a running job.
        var followKey = compFollowKey(comp);

        if (autoFollowCheck.value &&
            !$.global.__SMART_RENDER_FLOATING_STATE__) {
            if (followKey && followKey !== lastFollowedCompKey) {
                lastFollowedCompKey = followKey;
                applyCompOutput(comp);
            }
        } else if (!autoFollowCheck.value) {
            // Stay in sync while disabled so re-enabling only follows a real
            // comp switch, not the comp that was already selected.
            lastFollowedCompKey = followKey;
        }

        if (!folderEdit.text.length) {
            var savedTemplate = loadOutputTemplate(comp);

            if (savedTemplate) {
                folderEdit.text = savedTemplate.fsName;
            } else {
                folderEdit.text = makeOutputTemplate(
                    defaultOutputFolder(comp),
                    safeName(comp.name)
                ).fsName;
            }
        }

        var currentOutput = parseOutputSelection(folderEdit.text, comp);
        folderEdit.text = currentOutput.templateFile.fsName;
        activeBaseName = currentOutput.baseName;
        updateRenderButtonLabel(comp);

        var activeState = $.global.__SMART_RENDER_FLOATING_STATE__;

        if (activeState) {
            // Never re-enable destructive/render controls just because the
            // floating palette regained focus.
            renderBtn.enabled = false;
            refreshCompBtn.enabled = false;
            deleteRangeBtn.enabled = false;
            clearBtn.enabled = false;
            draftCheck.enabled = false;
            finalCheck.enabled = false;
            resolutionSlider.enabled = false;
            renderModeDrop.enabled = false;
            alphaCheck.enabled = false;
            crfSlider.enabled = false;
            incrementMp4Check.enabled = false;
            fixNamesBtn.enabled = false;
            forceEndBtn.enabled = true;
            scanRenderBtn.enabled = false;
            updateBatchButtons();
            return;
        }

        renderBtn.enabled = true;
        fixNamesBtn.enabled = true;
        refreshCompBtn.enabled = true;
        deleteRangeBtn.enabled = true;
        clearBtn.enabled = true;
        draftCheck.enabled = true;
        finalCheck.enabled = true;
        resolutionSlider.enabled = true;
        renderModeDrop.enabled = true;
        updateRenderModeUI();
        incrementMp4Check.enabled = true;
        forceEndBtn.enabled = false;
        scanRenderBtn.enabled = true;

        // A batch between items briefly has no active job; keep the panel locked
        // and End Render live so the queue cannot be disturbed mid-run.
        if (batchActive()) {
            renderBtn.enabled = false;
            fixNamesBtn.enabled = false;
            forceEndBtn.enabled = true;
            scanRenderBtn.enabled = false;
        }

        updateBatchButtons();

        // A closed palette can reconnect later through SCAN ACTIVE RENDER.
    }

    // ---------- fix file names ----------

    function padNum(n, width) {
        var neg = n < 0;
        var s = String(Math.abs(n));
        while (s.length < width) s = "0" + s;
        return (neg ? "-" : "") + s;
    }

    // Group frame files in a folder into distinct sequences by the text before
    // the trailing _NNNNN. Returns the biggest first.
    function scanRenderSequences(folder) {
        var groups = {};
        var exts = ["png", "jpg", "jpeg"];

        for (var e = 0; e < exts.length; e++) {
            var files;
            try {
                files = folder.getFiles("*." + exts[e]);
            } catch (err) {
                continue;
            }

            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                if (!(f instanceof File)) continue;

                var nm = decodedFileName(f);
                var m = /^(.+)_(\d{2,})\.(png|jpe?g)$/i.exec(nm);
                if (!m) continue;

                var prefix = m[1];
                var numStr = m[2];
                var ext = m[3].toLowerCase();
                var key = prefix + "|" + ext;

                if (!groups[key]) {
                    groups[key] = {
                        prefix: prefix,
                        ext: ext,
                        pad: numStr.length,
                        count: 0,
                        minNum: null,
                        maxNum: null,
                        files: []
                    };
                }

                var g = groups[key];
                var n = parseInt(numStr, 10);
                g.count++;
                g.files.push({ file: f, num: n });
                if (g.minNum === null || n < g.minNum) g.minNum = n;
                if (g.maxNum === null || n > g.maxNum) g.maxNum = n;
                if (numStr.length > g.pad) g.pad = numStr.length;
            }
        }

        var out = [];
        for (var k in groups) {
            if (groups.hasOwnProperty(k) && groups[k].count >= 2) {
                out.push(groups[k]);
            }
        }
        out.sort(function(a, b) { return b.count - a.count; });
        return out;
    }

    function scanRenderMovies(folder) {
        var out = [];
        try {
            var files = folder.getFiles("*.mp4");
            for (var i = 0; i < files.length; i++) {
                if (files[i] instanceof File) out.push(files[i]);
            }
        } catch (e) {}
        out.sort(function(a, b) {
            return b.modified.getTime() - a.modified.getTime();
        });
        return out;
    }

    // Dialog shown when the folder holds more than one sequence or MP4.
    // Returns { seqIndex, movieIndex, deleteRest } or null on cancel.
    function fixNamesDialog(folder, targetFrameBase, targetExt, targetMovieName, seqs, movies) {
        var dlg = new Window(
            "dialog",
            SCRIPT_NAME + " - Fix file names",
            undefined,
            { closeButton: true }
        );
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.spacing = 9;
        dlg.margins = 14;

        var head = dlg.add("statictext", undefined,
            "More than one render was found in this folder. Pick the one to keep.");
        head.characters = 68;

        var pathTxt = dlg.add("statictext", undefined, folder.fsName);
        pathTxt.characters = 68;

        var tgt = dlg.add("statictext", undefined,
            "Rename to:   " + targetFrameBase + "_#####." + targetExt +
            "     /     " + targetMovieName);
        tgt.characters = 68;

        var seqRadios = [];
        if (seqs.length) {
            var seqPanel = dlg.add("panel", undefined, "Render sequence");
            seqPanel.orientation = "column";
            seqPanel.alignChildren = ["left", "top"];
            seqPanel.margins = 10;
            seqPanel.spacing = 3;

            for (var i = 0; i < seqs.length; i++) {
                var g = seqs[i];
                var rb = seqPanel.add("radiobutton", undefined,
                    g.prefix + "_#####." + g.ext + "    -    " +
                    g.count + " frames (" + padNum(g.minNum, 5) +
                    " to " + padNum(g.maxNum, 5) + ")");
                rb.value = (i === 0);
                seqRadios.push(rb);
            }
        }

        var movieRadios = [];
        var movieNoneRadio = null;
        if (movies.length) {
            var moviePanel = dlg.add("panel", undefined, "MP4 file");
            moviePanel.orientation = "column";
            moviePanel.alignChildren = ["left", "top"];
            moviePanel.margins = 10;
            moviePanel.spacing = 3;

            for (var j = 0; j < movies.length; j++) {
                var mrb = moviePanel.add("radiobutton", undefined,
                    decodedFileName(movies[j]));
                mrb.value = (j === 0);
                movieRadios.push(mrb);
            }
            movieNoneRadio = moviePanel.add("radiobutton", undefined,
                "(leave the MP4 files alone)");
        }

        var delCheck = dlg.add("checkbox", undefined,
            "Delete the sequences / MP4s that are not selected");
        delCheck.value = false;
        delCheck.enabled = (seqs.length > 1 || movies.length > 1);

        var buttons = dlg.add("group");
        buttons.orientation = "row";
        buttons.alignment = ["right", "top"];
        buttons.spacing = 8;

        var cancelBtn = buttons.add("button", undefined, "Cancel");
        var okBtn = buttons.add("button", undefined, "Fix Names");

        var result = null;

        cancelBtn.onClick = function() { dlg.close(); };
        okBtn.onClick = function() {
            var si = 0;
            for (var a = 0; a < seqRadios.length; a++) {
                if (seqRadios[a].value) { si = a; break; }
            }
            var mi = movies.length ? 0 : -1;
            for (var b = 0; b < movieRadios.length; b++) {
                if (movieRadios[b].value) { mi = b; break; }
            }
            if (movieNoneRadio && movieNoneRadio.value) mi = -1;

            result = {
                seqIndex: seqs.length ? si : -1,
                movieIndex: mi,
                deleteRest: delCheck.enabled && delCheck.value
            };
            dlg.close();
        };

        dlg.cancelElement = cancelBtn;
        dlg.defaultElement = okBtn;
        dlg.center();
        dlg.show();

        return result;
    }

    function applyNameFix(folder, targetFrameBase, targetExt, targetMovieName,
                          seqs, seqIdx, movies, movieIdx, deleteRest) {
        var renamed = 0, deleted = 0, skipped = 0;
        var errors = [];
        var i, j;

        // Pass 1: delete the unselected sequences / movies first, so their old
        // names can't collide with the rename that follows.
        if (deleteRest) {
            for (i = 0; i < seqs.length; i++) {
                if (i === seqIdx || seqIdx < 0) continue;
                for (j = 0; j < seqs[i].files.length; j++) {
                    try {
                        if (seqs[i].files[j].file.remove()) deleted++;
                    } catch (rmErr) {}
                }
            }
            for (i = 0; i < movies.length; i++) {
                if (i === movieIdx || movieIdx < 0) continue;
                try {
                    if (movies[i].remove()) deleted++;
                } catch (rmErr2) {}
            }
        }

        // Pass 2: rename the selected sequence.
        if (seqIdx >= 0 && seqIdx < seqs.length) {
            var g = seqs[seqIdx];
            var width = Math.max(5, g.pad);
            for (j = 0; j < g.files.length; j++) {
                var entry = g.files[j];
                var newName = targetFrameBase + "_" +
                    padNum(entry.num, width) + "." + g.ext;

                if (decodedFileName(entry.file) === newName) continue;

                var target = new File(folder.fsName + "\\" + newName);
                if (target.exists) { skipped++; continue; }

                try {
                    if (entry.file.rename(newName)) renamed++;
                    else errors.push(newName);
                } catch (renErr) {
                    errors.push(newName + "  (" + renErr + ")");
                }
            }
        }

        // Pass 3: rename the selected movie.
        if (movieIdx >= 0 && movieIdx < movies.length) {
            var mv = movies[movieIdx];
            if (decodedFileName(mv) !== targetMovieName) {
                var mt = new File(folder.fsName + "\\" + targetMovieName);
                if (mt.exists &&
                    mt.fsName.toLowerCase() !== mv.fsName.toLowerCase()) {
                    skipped++;
                } else {
                    try {
                        if (mv.rename(targetMovieName)) renamed++;
                        else errors.push(targetMovieName);
                    } catch (mvErr) {
                        errors.push(targetMovieName + "  (" + mvErr + ")");
                    }
                }
            }
        }

        if (errors.length) {
            alert("Some files could not be renamed:\n\n" +
                errors.slice(0, 14).join("\n"));
        }

        var msg = "Fixed names: " + renamed + " renamed";
        if (deleted) msg += ", " + deleted + " deleted";
        if (skipped) msg += ", " + skipped + " skipped (name exists)";
        return msg;
    }

    function fixOutputNames() {
        if ($.global.__SMART_RENDER_FLOATING_STATE__ || batchActive()) {
            statusText.text = "Can't fix names while a render is running.";
            return;
        }

        var comp = getActiveComp();
        if (!comp) {
            alert("Select a composition first.");
            return;
        }
        if (!folderEdit.text.length) {
            alert("Choose an output folder first.");
            return;
        }

        var sel = parseOutputSelection(folderEdit.text, comp);
        var folder = sel.folder;
        if (!folder || !folder.exists) {
            alert("The output folder does not exist yet:\n\n" +
                (folder ? folder.fsName : "?"));
            return;
        }

        var renderMode = currentRenderMode();
        var profile = renderProfileFor(comp, sel.baseName, renderMode);
        var targetExt = renderMode === "JPEG" ? "jpg" : "png";
        var targetFrameBase = safeName(profile.cacheBase);
        var targetMovieName = incrementMp4Check.value ?
            safeName(profile.movieBase) + "_1.mp4" :
            safeName(profile.movieBase) + ".mp4";

        var seqs = scanRenderSequences(folder);
        var movies = scanRenderMovies(folder);

        if (!seqs.length && !movies.length) {
            alert("No render sequence or MP4 found in:\n\n" + folder.fsName);
            return;
        }

        var seqIdx = seqs.length ? 0 : -1;
        var movieIdx = movies.length ? 0 : -1;
        var deleteRest = false;

        if (seqs.length > 1 || movies.length > 1) {
            var pick = fixNamesDialog(
                folder, targetFrameBase, targetExt, targetMovieName, seqs, movies
            );
            if (!pick) return;
            seqIdx = pick.seqIndex;
            movieIdx = pick.movieIndex;
            deleteRest = pick.deleteRest;
        } else {
            var confirmLines = [];
            if (seqs.length) {
                confirmLines.push("Frames:  " + seqs[0].prefix + "_#####." +
                    seqs[0].ext + "   ->   " + targetFrameBase + "_#####." +
                    seqs[0].ext + "   (" + seqs[0].count + " files)");
            }
            if (movies.length) {
                confirmLines.push("Movie:   " + decodedFileName(movies[0]) +
                    "   ->   " + targetMovieName);
            }
            if (!confirm("Fix file names in:\n" + folder.fsName + "\n\n" +
                confirmLines.join("\n"))) {
                return;
            }
        }

        var report = applyNameFix(
            folder, targetFrameBase, targetExt, targetMovieName,
            seqs, seqIdx, movies, movieIdx, deleteRest
        );

        forgetSequenceBaseCache();
        statusText.text = report;
        updateRenderButtonLabel(comp);
    }

    fixNamesBtn.onClick = function() {
        fixOutputNames();
    };

    browseFolderBtn.onClick = function() {
        var comp = getActiveComp();
        var initialTemplate = null;

        try {
            if (folderEdit.text.length) {
                initialTemplate = parseOutputSelection(
                    folderEdit.text,
                    comp
                ).templateFile;
            }
        } catch (e) {}

        var picked = modernPngSequenceDialog(
            "Choose render output name",
            initialTemplate
        );

        if (picked) {
            forgetSequenceBaseCache();
            folderEdit.text = picked.fsName;

            if (comp) {
                saveOutputTemplate(comp, picked);
            }

            activeBaseName = sequenceBaseFromFileName(picked.name);
            updateRenderButtonLabel(comp);
        }
    };

    openOutputBtn.onClick = function() {
        if (folderEdit.text.length) {
            var f = parseOutputSelection(
                folderEdit.text,
                getActiveComp()
            ).folder;
            if (f.exists) f.execute();
        }
    };

    openLogBtn.onClick = function() {
        if (lastLogPath.length) openPath(lastLogPath);
    };

    deleteRangeBtn.onClick = function() {
        var comp = getActiveComp();

        if (!comp) {
            showCacheDialog(
                "Select a composition",
                [["Action", "Delete Work Area"]],
                "Open a composition and try again.",
                null
            );
            return;
        }

        var outputSelection = parseOutputSelection(folderEdit.text, comp);
        var folder = outputSelection.folder;

        if (!folder.exists) {
            showCacheDialog(
                "Cache not found",
                [
                    ["Comp", compactButtonName(comp.name, 32)],
                    ["Sequence", outputSelection.templateFile.name]
                ],
                "Render once to create this cache.",
                null
            );
            return;
        }

        // Always use the CURRENT work area at the moment the button is clicked.
        // It does not matter where the previous render started.
        var range = getFrameRange(comp, true);
        var outputBase = outputSelection.baseName;

        var matches = getCachedFrameFilesAllProfiles(
            folder.fsName,
            outputBase,
            range.start,
            range.end
        );

        var startTC = frameToTimeString(comp, range.start);

        // Display the end as the exclusive Work Area out point so it matches
        // what the user sees on the timeline. The files deleted are inclusive
        // start..end according to the frame range calculation.
        var outFrameExclusive = range.end + 1;
        var endTC = frameToTimeString(comp, outFrameExclusive);

        if (!matches.length) {
            showCacheDialog(
                "Nothing to delete",
                [
                    ["Comp", compactButtonName(comp.name, 32)],
                    ["Work Area", startTC + " - " + endTC],
                    ["Frames", "0 cached frames"]
                ],
                "This range is already clear.",
                null
            );
            return;
        }

        if (!showCacheDialog(
            "Delete Work Area?",
            [
                ["Comp", compactButtonName(comp.name, 32)],
                ["Work Area", startTC + " - " + endTC],
                ["Frames", matches.length + " cached frames"],
                ["Profiles", "All render profiles"]
            ],
            "MP4 files are kept.",
            "Delete"
        )) return;

        var removed = 0;
        var failed = 0;

        for (var i = 0; i < matches.length; i++) {
            try {
                if (matches[i].file.remove()) {
                    removed++;
                } else {
                    failed++;
                }
            } catch (e) {
                failed++;
            }
        }

        progressBar.value = 0;
        setProgressLineComplete(false);

        if (failed > 0) {
            progressText.text =
                "Deleted " + removed + "  \u2022  Failed " + failed;
            statusText.text = "Some cache files could not be deleted.";
        } else {
            progressText.text = "Deleted " + removed + " cached frames";
            statusText.text = "Ready.";
        }
    };

    clearBtn.onClick = function() {
        var comp = getActiveComp();
        if (!comp) {
            showCacheDialog(
                "Select a composition",
                [["Action", "Clear All"]],
                "Open a composition and try again.",
                null
            );
            return;
        }

        var outputSelection = parseOutputSelection(folderEdit.text, comp);
        var folder = outputSelection.folder;
        if (!folder.exists) {
            showCacheDialog(
                "Cache not found",
                [["Sequence", outputSelection.templateFile.name]],
                "Render once to create this cache.",
                null
            );
            return;
        }

        var base = outputSelection.baseName;
        var files = folder.getFiles(function(f) {
            if (!(f instanceof File)) return false;
            var n = decodedFileName(f).toLowerCase();
            return n.indexOf((base + "_").toLowerCase()) === 0 &&
                   (/\.(?:png|jpe?g)$/i).test(n);
        });

        if (!files.length) {
            showCacheDialog(
                "Nothing to clear",
                [
                    ["Comp", compactButtonName(comp.name, 32)],
                    ["Sequence", base],
                    ["Frames", "0 cached frames"]
                ],
                "This cache is already empty.",
                null
            );
            return;
        }

        if (!showCacheDialog(
            "Clear all frame cache?",
            [
                ["Comp", compactButtonName(comp.name, 32)],
                ["Sequence", base],
                ["Frames", files.length + " cached frames"],
                ["Scope", "All ranges and profiles"]
            ],
            "MP4 files are kept.",
            "Clear Frames"
        )) {
            return;
        }

        var removed = 0;
        for (var i = 0; i < files.length; i++) {
            try {
                if (files[i].remove()) removed++;
            } catch (e) {}
        }

        progressBar.value = 0;
        setProgressLineComplete(false);
        progressText.text = "Deleted " + removed + " cached frames";
        statusText.text = "Ready.";
    };

    // ---------- background status polling ----------

    function manifestFlagExists(path) {
        if (!path) return false;

        try {
            return new File(path).exists;
        } catch (e) {}

        return false;
    }

    function jobManifestIsFinished(data) {
        if (!data) return true;

        return manifestFlagExists(data.donePath) ||
            manifestFlagExists(data.renderFailPath) ||
            manifestFlagExists(data.audioFailPath) ||
            manifestFlagExists(data.encodeFailPath) ||
            manifestFlagExists(data.cancelPath);
    }

    function findNewestActiveJobManifest() {
        if (!app.project.file) return null;

        var projectPath = app.project.file.fsName;
        var entries = Folder.temp.getFiles("AE_SmartRender_*");
        var jobs = [];

        for (var i = 0; i < entries.length; i++) {
            if (!(entries[i] instanceof Folder)) continue;

            var manifestFile = new File(
                entries[i].fsName + "\\SMART_RENDER_JOB.info"
            );

            if (!manifestFile.exists) continue;

            var data = readJobManifest(manifestFile);

            if (!data) {
                removeJobManifest(manifestFile.fsName);
                continue;
            }

            if (!data.projectPath || data.projectPath !== projectPath) {
                continue;
            }

            // A cancel flag is not enough: AE 2026 may have detached a worker.
            // Keep the job recoverable until every tracked process is gone.
            var hasLiveProcess = jobHasLiveProcess(data);
            if (jobManifestIsFinished(data) && !hasLiveProcess) {
                removeJobManifest(manifestFile.fsName);
                continue;
            }

            var liveOrStarting = hasLiveProcess ||
                (data.jobStartTime > 0 &&
                 (new Date().getTime() - data.jobStartTime) < 120000);
            if (!liveOrStarting) {
                removeJobManifest(manifestFile.fsName);
                continue;
            }

            var modifiedMs = 0;
            try {
                modifiedMs = manifestFile.modified.getTime();
            } catch (modifiedErr) {}

            jobs.push({
                file: manifestFile,
                data: data,
                stamp: data.jobStartTime || modifiedMs
            });
        }

        if (!jobs.length) return null;

        jobs.sort(function(a, b) {
            return b.stamp - a.stamp;
        });

        jobs[0].count = jobs.length;
        return jobs[0];
    }

    function connectToScannedJob(found) {
        if (!found || !found.data || !found.file) return false;

        var data = found.data;
        var nowMs = new Date().getTime();
        var readyFrames = data.renderMode === "FAST_MP4" ?
            readBackgroundProgressCount(
                data.progressPath || "",
                data.totalFrames
            ) :
            countRenderedFrames(
                data.outputFolder,
                data.baseName,
                data.startFrame,
                data.endFrame,
                data.frameExtension || "png"
            );

        if (readyFrames === null) readyFrames = 0;

        if (readyFrames < 0) readyFrames = 0;
        if (readyFrames > data.totalFrames) readyFrames = data.totalFrames;

        var percent = Math.floor(
            (readyFrames / data.totalFrames) * 100
        );

        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        var recoveredOutputBase = data.outputBase || outputBaseFromProfileBase(
            data.baseName,
            data.qualityMode,
            data.resolutionPct
        );
        folderEdit.text = makeOutputTemplate(
            new Folder(data.outputFolder),
            recoveredOutputBase
        ).fsName;
        activeBaseName = data.baseName;
        draftCheck.value = data.qualityMode === "DRAFT";
        finalCheck.value = !draftCheck.value;
        resolutionSlider.value = snapResolutionPercent(data.resolutionPct);
        updateResolutionUI(true);
        alphaCheck.value = data.includeAlpha;
        saveAlphaSetting(alphaCheck.value);
        renderModeDrop.selection = data.renderMode === "FAST_MP4" ? 1 :
            (data.renderMode === "FAST_PNG" ? 2 :
            (data.renderMode === "JPEG" ? 3 :
            (data.renderMode === "PNG" ? 4 : 0)));
        saveRenderModeSetting(data.renderMode);
        updateRenderModeUI();
        crfSlider.value = Math.max(
            14,
            Math.min(28, parseInt(data.crf || loadCrfSetting(), 10))
        );
        updateCrfUI(true);
        updateRenderModeUI();

        lastLogPath = data.logPath || "";
        openLogBtn.enabled = lastLogPath.length > 0;

        renderBtn.enabled = false;
        refreshCompBtn.enabled = false;
        deleteRangeBtn.enabled = false;
        clearBtn.enabled = false;
        draftCheck.enabled = false;
        finalCheck.enabled = false;
        resolutionSlider.enabled = false;
        renderModeDrop.enabled = false;
        alphaCheck.enabled = false;
        crfSlider.enabled = false;
        incrementMp4Check.enabled = false;
        forceEndBtn.enabled = true;
        scanRenderBtn.enabled = false;

        progressBar.value = percent;
        setProgressLineComplete(false);
        progressText.text =
            readyFrames + " / " + data.totalFrames +
            " frames  \u2022  " + percent + "%";
        activeJobText.text =
            compactButtonName(data.compName, 34) +
            "  \u2022  RECOVERED";
        jobTimeText.text =
            "Time " + formatJobDuration(
                Math.max(0, (nowMs - (data.jobStartTime || nowMs)) / 1000)
            ) + "  \u2022  ETA calculating...";

        $.global.__SMART_RENDER_FLOATING_STATE__ = {
            donePath: data.donePath,
            renderFailPath: data.renderFailPath,
            audioFailPath: data.audioFailPath || "",
            encodeFailPath: data.encodeFailPath,
            processIdPath: data.processIdPath || "",
            workerIdPath: data.workerIdPath || "",
            cancelPath: data.cancelPath || "",
            projectPath: data.projectPath || "",
            jobCompName: data.compName || "Unknown comp",
            startTimeMs: data.jobStartTime || nowMs,

            outputFolder: data.outputFolder,
            baseName: data.baseName,
            startFrame: data.startFrame,
            endFrame: data.endFrame,
            totalFrames: data.totalFrames,
            renderMode: data.renderMode || "PNG",
            frameExtension: data.frameExtension || "png",
            initialCached: data.initialCached,
            framesToRender: data.framesToRender,
            expectedWrites: data.framesToRender,
            baseline: null,
            progressPath: data.progressPath || "",
            currentFramePath: data.currentFramePath || "",
            lastReadyFrames: readyFrames,
            lastFullScanMs: nowMs,
            renderDonePath: data.renderDonePath || "",
            retryPath: data.retryPath || "",
            audioStartedPath: data.audioStartedPath || "",
            audioDonePath: data.audioDonePath || "",
            encodeStartedPath: data.encodeStartedPath || "",
            encodeDonePath: data.encodeDonePath || "",

            progress: progressBar,
            progressText: progressText,
            status: statusText,
            activeJobText: activeJobText,
            jobTimeText: jobTimeText,
            button: renderBtn,
            deleteRangeButton: deleteRangeBtn,
            clearButton: clearBtn,
            draftCheck: draftCheck,
            finalCheck: finalCheck,
            resolutionSlider: resolutionSlider,
            renderModeDrop: renderModeDrop,
            alphaCheck: alphaCheck,
            crfSlider: crfSlider,
            incrementMp4Check: incrementMp4Check,
            forceEndButton: forceEndBtn,
            scanRenderButton: scanRenderBtn,
            makeMP4: data.makeMP4,
            manifestPath: found.file.fsName
        };

        statusText.text = found.count > 1 ?
            "Recovered newest render" :
            "Render reconnected";

        // Read all current flags and frame counts immediately.
        $.global.__smartRenderFloatingPoll();
        return true;
    }

    $.global.__SMART_RENDER_FLOATING_STATE__ = null;

    // A reloaded script cannot keep driving a queue that referenced the old
    // palette's widgets. The detached render for the current item keeps running
    // and stays reconnectable through Scan Render.
    $.global.__SMART_RENDER_BATCH__ = null;

    $.global.__smartRenderFloatingPoll = function() {
        var state = $.global.__SMART_RENDER_FLOATING_STATE__;
        if (!state) return;

        try {
            var done = new File(state.donePath);
            var renderDone = state.renderDonePath ?
                new File(state.renderDonePath) :
                null;
            var retry = state.retryPath ?
                new File(state.retryPath) :
                null;
            var encodeStarted = state.encodeStartedPath ?
                new File(state.encodeStartedPath) :
                null;
            var encodeDone = state.encodeDonePath ?
                new File(state.encodeDonePath) :
                null;
            var audioStarted = state.audioStartedPath ?
                new File(state.audioStartedPath) :
                null;
            var audioDone = state.audioDonePath ?
                new File(state.audioDonePath) :
                null;
            var renderFail = new File(state.renderFailPath);
            var audioFail = state.audioFailPath ?
                new File(state.audioFailPath) :
                null;
            var encodeFail = new File(state.encodeFailPath);
            var cancelled = state.cancelPath ?
                new File(state.cancelPath) :
                null;
            var retryPrefix = "";

            if (retry && retry.exists) {
                var failedAttempt = readTextFile(retry).replace(
                    /^\s+|\s+$/g,
                    ""
                );

                retryPrefix =
                    "Retry " +
                    (failedAttempt.length ? failedAttempt + "/3" : "active") +
                    "  \u2022  ";
            }

            if (cancelled && cancelled.exists) {
                if (jobHasLiveProcess(state)) {
                    state.status.text = "Ending render processes...";
                    app.scheduleTask(
                        "$.global.__smartRenderFloatingPoll()",
                        UI_POLL_MS,
                        false
                    );
                    return;
                }

                var cancelledElapsed = Math.max(
                    0,
                    (new Date().getTime() - state.startTimeMs) / 1000
                );

                state.status.text = "Render ended.";
                state.activeJobText.text =
                    "Last: " + state.jobCompName + "  \u2022  ENDED";
                state.jobTimeText.text =
                    "Ended after " + formatJobDuration(cancelledElapsed);

                removeJobManifest(state.manifestPath);
                $.global.__SMART_RENDER_FLOATING_STATE__ = null;
                if (state.batchOwned && batchAdvanceAfterItem("cancel")) {
                    updateRenderButtonLabel();
                    return;
                }
                enableRenderControls(state);
                updateRenderButtonLabel();
                return;
            }

            if (done.exists) {
                state.progress.value = 100;
                setProgressLineComplete(true);
                state.progressText.text =
                    state.totalFrames + " / " + state.totalFrames +
                    " frames  \u2022  100%";
                state.status.text = "Complete  \u2022  MP4 + audio";
                var completedElapsed = Math.max(
                    0,
                    (new Date().getTime() - state.startTimeMs) / 1000
                );
                state.activeJobText.text =
                    "Last: " + state.jobCompName + "  \u2022  COMPLETE";
                state.jobTimeText.text =
                    "Completed in " + formatJobDuration(completedElapsed);

                removeJobManifest(state.manifestPath);
                $.global.__SMART_RENDER_FLOATING_STATE__ = null;
                if (state.batchOwned && batchAdvanceAfterItem("ok")) {
                    updateRenderButtonLabel();
                    return;
                }
                enableRenderControls(state);
                updateRenderButtonLabel();
                return;
            }

            if (renderFail.exists) {
                state.status.text = "Render failed  \u2022  Open Log";
                state.activeJobText.text =
                    "Last: " + state.jobCompName + "  \u2022  FAILED";
                state.jobTimeText.text =
                    "Failed after " + formatJobDuration(
                        (new Date().getTime() - state.startTimeMs) / 1000
                    );
                removeJobManifest(state.manifestPath);
                $.global.__SMART_RENDER_FLOATING_STATE__ = null;
                if (state.batchOwned && batchAdvanceAfterItem("fail")) {
                    updateRenderButtonLabel();
                    return;
                }
                enableRenderControls(state);
                updateRenderButtonLabel();
                return;
            }

            if (audioFail && audioFail.exists) {
                state.progress.value = 100;
                state.progressText.text = "Video render complete";
                state.status.text =
                    "Audio failed  \u2022  Open Log";
                state.activeJobText.text =
                    "Last: " + state.jobCompName + "  \u2022  AUDIO FAILED";
                state.jobTimeText.text =
                    "Failed after " + formatJobDuration(
                        (new Date().getTime() - state.startTimeMs) / 1000
                    );
                removeJobManifest(state.manifestPath);
                $.global.__SMART_RENDER_FLOATING_STATE__ = null;
                if (state.batchOwned && batchAdvanceAfterItem("fail")) {
                    updateRenderButtonLabel();
                    return;
                }
                enableRenderControls(state);
                updateRenderButtonLabel();
                return;
            }

            if (encodeFail.exists) {
                state.progress.value = 100;
                state.progressText.text = "Video render complete";
                state.status.text =
                    "MP4 failed  \u2022  Open Log";
                state.activeJobText.text =
                    "Last: " + state.jobCompName + "  \u2022  ENCODE FAILED";
                state.jobTimeText.text =
                    "Failed after " + formatJobDuration(
                        (new Date().getTime() - state.startTimeMs) / 1000
                    );
                removeJobManifest(state.manifestPath);
                $.global.__SMART_RENDER_FLOATING_STATE__ = null;
                if (state.batchOwned && batchAdvanceAfterItem("fail")) {
                    updateRenderButtonLabel();
                    return;
                }
                enableRenderControls(state);
                updateRenderButtonLabel();
                return;
            }

            // RENDER_DONE.flag is created only after the requested output is
            // verified stable. Therefore 100% cannot be reported early.
            if (renderDone && renderDone.exists) {
                state.progress.value = 100;
                state.progressText.text =
                    state.totalFrames + " / " + state.totalFrames +
                    " frames  \u2022  100%";

                if (encodeDone && encodeDone.exists) {
                    state.status.text = "MP4 ready  \u2022  finishing";
                } else if (encodeStarted && encodeStarted.exists) {
                    state.status.text = "Encoding MP4 + audio...";
                } else if (audioDone && audioDone.exists) {
                    state.status.text = "Audio ready  \u2022  MP4 next";
                } else if (audioStarted && audioStarted.exists) {
                    state.status.text = "Rendering audio...";
                } else {
                    state.status.text = state.renderMode === "FAST_MP4" ?
                        "MP4 ready  \u2022  finishing" :
                        ((state.renderMode === "JPEG" ? "JPEG" : "PNG") +
                         " ready  \u2022  audio next");
                }

                updateJobClock(
                    state,
                    state.totalFrames,
                    "finishing MP4..."
                );

                app.scheduleTask(
                    "$.global.__smartRenderFloatingPoll()",
                    UI_POLL_MS,
                    false
                );
                return;
            }

            // Progress represents the whole requested range. Cached files count
            // immediately; missing frames increase the same total as AE writes.
            var readyFrames = getReadyFramesForUI(state);

            if (readyFrames < 0) readyFrames = 0;
            if (readyFrames > state.totalFrames) {
                readyFrames = state.totalFrames;
            }

            var percent = Math.floor(
                (readyFrames / state.totalFrames) * 100
            );

            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;

            state.progress.value = percent;
            state.progressText.text =
                readyFrames + " / " + state.totalFrames +
                " frames  \u2022  " + percent + "%";
            updateJobClock(state, readyFrames, "");

            var writtenNow = Math.max(
                0,
                readyFrames - state.initialCached
            );
            var missingRemaining = Math.max(
                0,
                state.framesToRender - writtenNow
            );
            var currentFrame = readIntegerSidecar(
                state.currentFramePath || ""
            );
            var currentFrameText = currentFrame === null ?
                "" :
                ("  \u2022  frame ~" + currentFrame);

            var frameLabel = state.renderMode === "JPEG" ? "JPEG" : "PNG";

            if (state.renderMode === "FAST_MP4") {
                state.status.text = "Rendering MP4 + audio...";
            } else if (state.framesToRender > 0) {
                state.status.text =
                    retryPrefix + frameLabel + currentFrameText +
                    "  \u2022  " + missingRemaining + " / " +
                    state.framesToRender + " left";
            } else {
                state.status.text =
                    retryPrefix + frameLabel + " cached  \u2022  verifying";
            }

            app.scheduleTask(
                "$.global.__smartRenderFloatingPoll()",
                UI_POLL_MS,
                false
            );

        } catch (e) {
            // A transient ScriptUI or network-read error must not permanently
            // kill polling and leave the disabled UI looking stuck.
            if ($.global.__SMART_RENDER_FLOATING_STATE__) {
                try {
                    state.status.text =
                        "Refreshing render status...";
                } catch (statusErr) {}

                try {
                    app.scheduleTask(
                        "$.global.__smartRenderFloatingPoll()",
                        UI_POLL_MS,
                        false
                    );
                } catch (retryErr) {}
            }
        }
    };

    // ---------- render ----------

    renderBtn.onClick = function() {
        startSmartRender(null, null, false);
    };

    // explicitComp / explicitOutputText are supplied by the batch queue; when
    // null the render targets the active comp and the File field, exactly as
    // the RENDER button always has. batchMode suppresses the reconnect prompt
    // and the write-back into the File field.
    function startSmartRender(explicitComp, explicitOutputText, batchMode) {

        // A render writes new frames; drop the cached folder->base detection.
        forgetSequenceBaseCache();

        var comp = explicitComp || getActiveComp();

        if (!comp) {
            alert("Open/select a composition first.");
            return;
        }

        if (!app.project.file) {
            alert("Save the After Effects project first.");
            return;
        }

        // This check runs only when Render is clicked, never on the UI timer.
        // It prevents two detached aerender workers from competing unnoticed.
        if (!batchMode) {
            var runningJob = findRunningSmartRenderJob();
            if (runningJob) {
                if (runningJob.data.projectPath === app.project.file.fsName) {
                    runningJob.count = 1;
                    connectToScannedJob(runningJob);
                    statusText.text = "Existing render reconnected";
                } else {
                    showCacheDialog(
                        "Render already running",
                        [
                            ["Comp", compactButtonName(runningJob.data.compName, 32)],
                            ["Mode", runningJob.data.renderMode || "PNG"]
                        ],
                        "End the existing Smart Render before starting another one.",
                        null
                    );
                }
                return;
            }
        }

        var outputSelection = parseOutputSelection(
            (explicitOutputText != null ? explicitOutputText : folderEdit.text),
            comp
        );
        var outFolder = outputSelection.folder;
        try {
            ensureFolder(outFolder);
        } catch (folderErr) {
            alert(folderErr.toString());
            return;
        }

        var aerender = findAerender();
        if (!aerender) {
            var manualAE = File.openDialog("Could not find aerender.exe. Choose it manually.", "Executables:*.exe");
            if (!manualAE) return;
            aerender = manualAE;
        }

        var renderMode = currentRenderMode();
        var isParallelPng = renderMode === "PARALLEL_PNG";
        var isDirectMp4 = renderMode === "FAST_MP4";
        var isFastPng = renderMode === "FAST_PNG";
        var isResumableSequence = renderMode === "JPEG" ||
            renderMode === "PNG";

        // Every mode creates an MP4. Sequence modes use FFmpeg after the frame
        // cache; Fast MP4 uses AE's native H.264 output module directly.
        var makeMP4 = true;
        var ffmpeg = isDirectMp4 ? null : findFFmpeg();

        if (!isDirectMp4 && (!ffmpeg || !ffmpeg.exists)) {
            alert(
                "FFmpeg was not found.\n\n" +
                "Smart Render checked Shutter Encoder's bundled FFmpeg and Windows PATH.\n\n" +
                "Expected Shutter Encoder location:\n" +
                "C:\\Program Files\\Shutter Encoder\\app\\Library\\ffmpeg.exe"
            );
            return;
        }

        // Find the actual installed template names from this AE instance.
        var templates = getTemplates(comp);
        var outputBase = outputSelection.baseName;
        var profile = renderProfileFor(comp, outputBase, renderMode);

        if (isResumableSequence && !templates.renderTemplate) {
            alert(
                "Could not find the Multi-Machine render-settings template.\n\n" +
                "Smart Render uses that template because Adobe's Multi-Machine Settings " +
                "enables Skip Existing Files."
            );
            return;
        }

        var frameExtension = renderMode === "JPEG" ? "jpg" : "png";
        var selectedOutputTemplate = null;

        if (isDirectMp4) {
            selectedOutputTemplate =
                templates.h264AudioTemplate || templates.h264Template;
        } else if (isParallelPng) {
            // TIFF is only a short-lived local transport format. Prefer an
            // alpha-capable template so the pipeline can preserve either RGB
            // or RGBA; FFmpeg drops alpha when the UI option is unchecked.
            selectedOutputTemplate = profile.includeAlpha ?
                templates.tiffAlphaTemplate :
                (templates.tiffTemplate || templates.tiffAlphaTemplate);
        } else if (renderMode === "JPEG") {
            selectedOutputTemplate = templates.jpegTemplate;
        } else {
            selectedOutputTemplate = profile.includeAlpha ?
                templates.pngAlphaTemplate :
                templates.pngRgbTemplate;
        }

        if (!selectedOutputTemplate) {
            var requiredTemplate = isDirectMp4 ?
                "an H.264 template with Audio Output On" :
                (isParallelPng ?
                    "TIFF Sequence with Alpha (temporary transport template)" :
                (renderMode === "JPEG" ?
                    "a JPEG Sequence template (recommended name: _jpg_sequence)" :
                    (profile.includeAlpha ? "_png_alpha_frame" : "_png_sequence")));

            alert(
                "Could not find the required Output Module template:\n\n" +
                requiredTemplate + "\n\n" +
                "Create/save that template in After Effects, then run Smart Render again."
            );
            return;
        }

        if (!templates.audioRenderTemplate) {
            alert(
                "Could not find the Best Settings render template.\n\n" +
                "Fast MP4 and the audio pass require normal Best Settings."
            );
            return;
        }

        if (!isDirectMp4 && !templates.audioTemplate) {
            alert(
                "No real Waveform Audio Output Module template was found.\n\n" +
                "A template's name is not enough: your WAV/Audio template is " +
                "currently H.264. Open Output Module Settings and set:\n\n" +
                "Format: Waveform Audio\n" +
                "Audio Output: On\n\n" +
                "Save that as a template, then run Smart Render again."
            );
            return;
        }

        var smartRenderTemplate = null;

        try {
            smartRenderTemplate = ensureSmartRenderTemplate(
                comp,
                (isDirectMp4 || isFastPng || isParallelPng) ?
                    templates.audioRenderTemplate :
                    templates.renderTemplate,
                profile,
                isResumableSequence
            );
        } catch (templateErr) {
            alert(templateErr.toString());
            return;
        }

        // Remember this one output location for the active comp.
        if (!batchMode) {
            folderEdit.text = outputSelection.templateFile.fsName;
        }
        saveOutputTemplate(comp, outputSelection.templateFile);

        // Save latest project changes before the separate aerender process opens it.
        try {
            app.project.save(app.project.file);
        } catch (saveErr) {
            alert("Could not save project:\n" + saveErr.toString());
            return;
        }

        var useWorkArea = rangeDrop.selection.index === 0;
        var range = getFrameRange(comp, useWorkArea);

        var cpuValues = [100, 85, 70, 50];
        var cpu = cpuValues[cpuDrop.selection.index];

        var base = isDirectMp4 ? profile.movieBase : profile.cacheBase;
        activeBaseName = base;

        var tempFrameFolder = null;

        var aeSequencePath =
            outFolder.fsName + "\\" + base + "_[#####]." + frameExtension;

        var ffSequencePath =
            outFolder.fsName + "\\" + base + "_%05d." + frameExtension;

        var movieFolder = getMovieFolderForOutput(
            outFolder,
            outputBase,
            isDirectMp4
        );

        // Resolve the final name once at job start. With incrementing enabled,
        // existing outputs are preserved as name.mp4, name.1.mp4, name.2.mp4...
        var movieChoice = chooseMp4Output(
            movieFolder,
            profile.movieBase,
            incrementMp4Check.value
        );

        var mp4Path = movieChoice.file.fsName;

        // Snapshot existing sequence frames before launch. Direct MP4 has no
        // frame cache, so progress starts at zero and comes from aerender.log.
        // While this UI stays open, progress tracks files created/re-written
        // by this specific render instead of counting old cache files.
        var totalFrames = Math.max(1, range.end - range.start + 1);

        var baseline = isDirectMp4 ?
            {count: 0, stamps: {}} :
            snapshotRenderedFrames(
                outFolder.fsName,
                base,
                range.start,
                range.end,
                frameExtension
            );

        // Native PNG intentionally rebuilds the requested range. Parallel PNG
        // is resumable: it renders only contiguous gaps in the final sequence.
        var isFullOverwrite = isFastPng;
        var initialCached = isFullOverwrite ? 0 : baseline.count;
        var parallelMissingRanges = isParallelPng ?
            missingFrameRanges(
                range.start,
                range.end,
                baseline.stamps
            ) : [];

        if (initialCached < 0) initialCached = 0;
        if (initialCached > totalFrames) initialCached = totalFrames;

        var framesToRender = isDirectMp4 ?
            totalFrames :
            Math.max(0, totalFrames - initialCached);

        // If some files are missing, those are the expected writes.
        // If all files already exist but AE rewrites them, track the whole
        // requested range instead.
        var expectedWrites =
            framesToRender > 0 ?
            framesToRender :
            totalFrames;

        // H.264 quality selected in the UI. Lower CRF means higher quality and
        // a larger file; PNG cache quality is unaffected.
        var crf = Math.max(
            14,
            Math.min(28, Math.round(Number(crfSlider.value)))
        );

        var jobFolder = new Folder(Folder.temp.fsName + "\\AE_SmartRender_" + timestamp());
        ensureFolder(jobFolder);
        var jobStartTimeMs = new Date().getTime();

        if (isParallelPng) {
            tempFrameFolder = new Folder(jobFolder.fsName + "\\TIFF_TEMP");
            ensureFolder(tempFrameFolder);
            aeSequencePath =
                tempFrameFolder.fsName + "\\" + base + "_[#####].tif";
        }

        var bat = new File(jobFolder.fsName + "\\run_render.bat");
        var vbs = new File(jobFolder.fsName + "\\launch_hidden.vbs");
        var monitorVbs = new File(jobFolder.fsName + "\\launch_monitor.vbs");
        var monitorPs1 = new File(jobFolder.fsName + "\\monitor_render.ps1");
        var waitPs1 = new File(jobFolder.fsName + "\\wait_for_png_sequence.ps1");
        var waitFilePs1 = new File(jobFolder.fsName + "\\wait_for_stable_file.ps1");
        var waitMoviePs1 = new File(jobFolder.fsName + "\\wait_for_movie.ps1");
        var captureWorkersPs1 = new File(jobFolder.fsName + "\\capture_workers.ps1");
        var convertPs1 = new File(jobFolder.fsName + "\\convert_tiff_to_png.ps1");
        var convertDoneFile = new File(jobFolder.fsName + "\\CONVERT_DONE.flag");
        var progressFile = new File(jobFolder.fsName + "\\PNG_PROGRESS.txt");
        var currentFrameFile = new File(jobFolder.fsName + "\\CURRENT_FRAME.txt");
        var log = new File(jobFolder.fsName + "\\render.log");
        // Keep aerender's own log separate so it cannot overwrite the batch/FFmpeg log.
        // After aerender exits, its contents are appended into render.log.
        var aeLog = new File(jobFolder.fsName + "\\aerender.log");
        var audioLog = new File(jobFolder.fsName + "\\aerender_audio.log");
        var audioWav = new File(jobFolder.fsName + "\\comp_audio.wav");
        var doneFile = new File(jobFolder.fsName + "\\DONE.flag");
        var renderDoneFile = new File(jobFolder.fsName + "\\RENDER_DONE.flag");
        var retryFile = new File(jobFolder.fsName + "\\RENDER_RETRY.flag");
        var audioStartedFile = new File(jobFolder.fsName + "\\AUDIO_STARTED.flag");
        var audioDoneFile = new File(jobFolder.fsName + "\\AUDIO_DONE.flag");
        var audioFailFile = new File(jobFolder.fsName + "\\AUDIO_FAILED.flag");
        var encodeStartedFile = new File(jobFolder.fsName + "\\ENCODE_STARTED.flag");
        var encodeDoneFile = new File(jobFolder.fsName + "\\ENCODE_DONE.flag");
        var renderFailFile = new File(jobFolder.fsName + "\\RENDER_FAILED.flag");
        var encodeFailFile = new File(jobFolder.fsName + "\\ENCODE_FAILED.flag");
        var processIdFile = new File(jobFolder.fsName + "\\PROCESS_ID.txt");
        var workerIdFile = new File(jobFolder.fsName + "\\WORKER_IDS.txt");
        var beforeWorkerIdFile = new File(jobFolder.fsName + "\\WORKER_IDS_BEFORE.txt");
        var cancelledFile = new File(jobFolder.fsName + "\\CANCELLED.flag");
        var manifestFile = new File(
            jobFolder.fsName + "\\SMART_RENDER_JOB.info"
        );

        // Encode into a temporary MP4 first. The real output file is replaced
        // only after FFmpeg returns successfully.
        var tempMp4Path =
            movieFolder.fsName + "\\" +
            movieChoice.stem + ".__encoding__.mp4";

        lastLogPath = log.fsName;
        openLogBtn.enabled = true;

        var projectPath = app.project.file.fsName;
        var fps = fpsString(comp);

        // aerender can return before AE's render workers have finished. This
        // helper is the authoritative completion gate between AE and FFmpeg.
        // It discovers frames by parsing their numeric suffix, so it also works
        // for negative frame numbers and does not depend on a padding guess.
        var waitScript = [
            "param(",
            "    [Parameter(Mandatory=$true)][string]$FolderPath,",
            "    [Parameter(Mandatory=$true)][string]$BaseName,",
            "    [Parameter(Mandatory=$true)][int]$StartFrame,",
            "    [Parameter(Mandatory=$true)][int]$EndFrame,",
            "    [Parameter(Mandatory=$true)][string]$LogPath,",
            "    [Parameter(Mandatory=$true)][string]$ProgressPath,",
            "    [Parameter(Mandatory=$true)][string]$Extension,",
            "    [Parameter(Mandatory=$true)][string]$ProgressMode,",
            "    [Parameter(Mandatory=$true)][double]$JobStartTimeMs,",
            "    [Parameter(Mandatory=$true)][string]$CancelPath,",
            "    [string]$FailurePath = ''",
            ")",
            "$ErrorActionPreference = 'Stop'",
            "$escapedBase = [regex]::Escape($BaseName)",
            "$escapedExtension = [regex]::Escape($Extension.TrimStart('.'))",
            "$namePattern = '^' + $escapedBase + '_(-?\\d+)\\.' + $escapedExtension + '$'",
            "$epoch = [DateTime]::SpecifyKind([datetime]'1970-01-01', [DateTimeKind]::Utc)",
            "$jobStartUtc = $epoch.AddMilliseconds($JobStartTimeMs).AddSeconds(-2)",
            "$previousSignature = $null",
            "$stablePasses = 0",
            "$previousPresent = -1",
            "$previousProgress = -1",
            "$previousBytes = [long]-1",
            "$lastProgress = [DateTime]::UtcNow",
            "while ($true) {",
            "    if (Test-Path -LiteralPath $CancelPath) { exit 13 }",
            "    if ($FailurePath -and (Test-Path -LiteralPath $FailurePath)) { exit 14 }",
            "    try {",
            "        $frames = @{}",
            "        foreach ($file in Get-ChildItem -LiteralPath $FolderPath -File -Filter ('*.' + $Extension.TrimStart('.'))) {",
            "            $match = [regex]::Match($file.Name, $namePattern, [Text.RegularExpressions.RegexOptions]::IgnoreCase)",
            "            if (-not $match.Success) { continue }",
            "            $number = 0",
            "            if (-not [int]::TryParse($match.Groups[1].Value, [ref]$number)) { continue }",
            "            if ($number -lt $StartFrame -or $number -gt $EndFrame) { continue }",
            "            $frames[$number] = $file",
            "        }",
            "",
            "        $complete = $true",
            "        $present = 0",
            "        $valid = 0",
            "        $bytes = [long]0",
            "        $signature = New-Object System.Text.StringBuilder",
            "",
            "        for ($frame = $StartFrame; $frame -le $EndFrame; $frame++) {",
            "            if (-not $frames.ContainsKey($frame)) {",
            "                $complete = $false",
            "                continue",
            "            }",
            "",
            "            $item = $frames[$frame]",
            "            $present++",
            "            $bytes += $item.Length",
            "            if ($item.Length -le 0) {",
            "                $complete = $false",
            "            } else {",
            "                $valid++",
            "            }",
            "            [void]$signature.Append($frame).Append(':').Append($item.Length).Append(':').Append($item.LastWriteTimeUtc.Ticks).Append('|')",
            "        }",
            "",
            "        $progressValue = $valid",
            "        if ($ProgressMode -eq 'TOUCHED') {",
            "            $progressValue = 0",
            "            foreach ($item in $frames.Values) {",
            "                if ($item.Length -gt 0 -and $item.LastWriteTimeUtc -ge $jobStartUtc) { $progressValue++ }",
            "            }",
            "        }",
            "",
            "        if ($progressValue -ne $previousProgress) {",
            "            [IO.File]::WriteAllText($ProgressPath, [string]$progressValue)",
            "            $previousProgress = $progressValue",
            "        }",
            "",
            "        if ($present -ne $previousPresent -or $bytes -ne $previousBytes) {",
            "            $lastProgress = [DateTime]::UtcNow",
            "            $previousPresent = $present",
            "            $previousBytes = $bytes",
            "        }",
            "",
            "        if ($complete) {",
            "            $currentSignature = $signature.ToString()",
            "            if ($currentSignature -eq $previousSignature) {",
            "                $stablePasses++",
            "            } else {",
            "                $previousSignature = $currentSignature",
            "                $stablePasses = 0",
            "            }",
            "",
            "            if ($stablePasses -ge 4) {",
            "                Add-Content -LiteralPath $LogPath -Value ('Verified {0} stable {1} frames.' -f $present, $Extension.ToUpper())",
            "                exit 0",
            "            }",
            "        } else {",
            "            $previousSignature = $null",
            "            $stablePasses = 0",
            "        }",
            "",
            "        if (([DateTime]::UtcNow - $lastProgress).TotalMinutes -ge 10) {",
            "            Add-Content -LiteralPath $LogPath -Value ('FRAME RENDER STALLED - no progress for 10 minutes ({0} frames present).' -f $present)",
            "            exit 12",
            "        }",
            "    } catch {",
            "        Add-Content -LiteralPath $LogPath -Value ('Frame verification warning: ' + $_.Exception.Message)",
            "    }",
            "",
            "    Start-Sleep -Milliseconds 1000",
            "}"
        ].join("\r\n");

        // Parallel PNG transport: AE writes a TIFF sequence into the private
        // job folder. FFmpeg consumes stable batches with frame threading and
        // low PNG compression, verifies the final PNGs, then deletes only the
        // corresponding temporary TIFFs. PNG compression remains lossless.
        var convertTiffScript = [
            "param(",
            "    [Parameter(Mandatory=$true)][string]$FFmpegPath,",
            "    [Parameter(Mandatory=$true)][string]$TempFolder,",
            "    [Parameter(Mandatory=$true)][string]$TempBase,",
            "    [Parameter(Mandatory=$true)][string]$OutputFolder,",
            "    [Parameter(Mandatory=$true)][string]$OutputBase,",
            "    [Parameter(Mandatory=$true)][int]$StartFrame,",
            "    [Parameter(Mandatory=$true)][int]$EndFrame,",
            "    [Parameter(Mandatory=$true)][int]$TempStartNumber,",
            "    [Parameter(Mandatory=$true)][string]$LogPath,",
            "    [Parameter(Mandatory=$true)][string]$ProgressPath,",
            "    [Parameter(Mandatory=$true)][string]$CurrentFramePath,",
            "    [Parameter(Mandatory=$true)][string]$CancelPath,",
            "    [Parameter(Mandatory=$true)][string]$DonePath,",
            "    [Parameter(Mandatory=$true)][string]$FailPath,",
            "    [Parameter(Mandatory=$true)][double]$JobStartTimeMs,",
            "    [Parameter(Mandatory=$true)][int]$ProgressOffset,",
            "    [Parameter(Mandatory=$true)][int]$IncludeAlpha",
            ")",
            "$ErrorActionPreference = 'Stop'",
            "$chunkSize = 24",
            "$epoch = [DateTime]::SpecifyKind([datetime]'1970-01-01', [DateTimeKind]::Utc)",
            "$jobStartUtc = $epoch.AddMilliseconds($JobStartTimeMs).AddSeconds(-2)",
            "function Token([int]$number) { return $number.ToString('D5', [Globalization.CultureInfo]::InvariantCulture) }",
            "function TempPath([int]$number) { $tempNumber = $TempStartNumber + ($number - $StartFrame); return Join-Path $TempFolder ($TempBase + '_' + (Token $tempNumber) + '.tif') }",
            "function PngPath([int]$number) { return Join-Path $OutputFolder ($OutputBase + '_' + (Token $number) + '.png') }",
            "function Is-CurrentPng([int]$number) {",
            "    $path = PngPath $number",
            "    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $false }",
            "    $item = Get-Item -LiteralPath $path",
            "    return $item.Length -gt 0 -and $item.LastWriteTimeUtc -ge $jobStartUtc",
            "}",
            "try {",
            "    Add-Content -LiteralPath $LogPath -Value 'Parallel PNG converter started (TIFF transport, lossless PNG compression level 1).'",
            "    $current = $StartFrame",
            "    while ($current -le $EndFrame) {",
            "        if (Test-Path -LiteralPath $CancelPath) { exit 13 }",
            "        if (Test-Path -LiteralPath $FailPath) { exit 14 }",
            "        $last = [Math]::Min($EndFrame, $current + $chunkSize - 1)",
            "        $allCurrent = $true",
            "        for ($n = $current; $n -le $last; $n++) { if (-not (Is-CurrentPng $n)) { $allCurrent = $false; break } }",
            "        if (-not $allCurrent) {",
            "            $stable = 0",
            "            $signature = ''",
            "            while ($stable -lt 2) {",
            "                if (Test-Path -LiteralPath $CancelPath) { exit 13 }",
            "                if (Test-Path -LiteralPath $FailPath) { exit 14 }",
            "                $ready = $true",
            "                $parts = New-Object System.Collections.Generic.List[string]",
            "                for ($n = $current; $n -le $last; $n++) {",
            "                    $path = TempPath $n",
            "                    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { $ready = $false; break }",
            "                    $item = Get-Item -LiteralPath $path",
            "                    if ($item.Length -le 0) { $ready = $false; break }",
            "                    $parts.Add(([string]$item.Length + ':' + [string]$item.LastWriteTimeUtc.Ticks))",
            "                }",
            "                if ($ready) {",
            "                    $nextSignature = $parts -join '|'",
            "                    if ($nextSignature -eq $signature) { $stable++ } else { $signature = $nextSignature; $stable = 0 }",
            "                } else { $signature = ''; $stable = 0 }",
            "                if ($stable -lt 2) { Start-Sleep -Milliseconds 300 }",
            "            }",
            "            $count = $last - $current + 1",
            "            $inputStart = $TempStartNumber + ($current - $StartFrame)",
            "            $inputPattern = Join-Path $TempFolder ($TempBase + '_%05d.tif')",
            "            $outputPattern = Join-Path $OutputFolder ($OutputBase + '_%05d.png')",
            "            $pixelFormat = $(if ($IncludeAlpha -eq 1) { 'rgba' } else { 'rgb24' })",
            "            # Numbered still-image input and output are already one frame per file. Avoid -vsync: it was removed by newer FFmpeg builds.",
            "            $arguments = @('-hide_banner','-loglevel','error','-y','-start_number',[string]$inputStart,'-i',$inputPattern,'-frames:v',[string]$count,'-c:v','png','-compression_level','1','-pred','mixed','-threads','0','-thread_type','frame','-pix_fmt',$pixelFormat,'-start_number',[string]$current,$outputPattern)",
            "            $conversionOkay = $false",
            "            $lastFfmpegExit = -1",
            "            for ($ffAttempt = 1; $ffAttempt -le 3; $ffAttempt++) {",
            "                $savedErrorPreference = $ErrorActionPreference",
            "                $ErrorActionPreference = 'Continue'",
            "                $ffMessages = @(& $FFmpegPath @arguments 2>&1)",
            "                $lastFfmpegExit = $LASTEXITCODE",
            "                $ErrorActionPreference = $savedErrorPreference",
            "                foreach ($message in $ffMessages) {",
            "                    $prefix = $(if ($lastFfmpegExit -eq 0) { 'FFmpeg notice (non-fatal, exit 0): ' } else { ('FFmpeg attempt ' + $ffAttempt + ': ') })",
            "                    Add-Content -LiteralPath $LogPath -Value ($prefix + [string]$message)",
            "                }",
            "                $outputsOkay = $lastFfmpegExit -eq 0",
            "                if ($outputsOkay) {",
            "                    for ($n = $current; $n -le $last; $n++) {",
            "                        $png = PngPath $n",
            "                        if (-not (Test-Path -LiteralPath $png -PathType Leaf) -or (Get-Item -LiteralPath $png).Length -le 0) { $outputsOkay = $false; break }",
            "                    }",
            "                }",
            "                if ($outputsOkay) { $conversionOkay = $true; break }",
            "                Add-Content -LiteralPath $LogPath -Value ('FFmpeg PNG batch attempt {0}/3 failed validation (exit {1}); retrying.' -f $ffAttempt, $lastFfmpegExit)",
            "                if ($ffAttempt -lt 3) { Start-Sleep -Seconds 1 }",
            "            }",
            "            if (-not $conversionOkay) { throw ('FFmpeg PNG conversion failed after 3 attempts; last exit code ' + $lastFfmpegExit) }",
            "        }",
            "        for ($n = $current; $n -le $last; $n++) { $tif = TempPath $n; if (Test-Path -LiteralPath $tif) { Remove-Item -LiteralPath $tif -Force } }",
            "        [IO.File]::WriteAllText($ProgressPath, [string]($ProgressOffset + $last - $StartFrame + 1))",
            "        [IO.File]::WriteAllText($CurrentFramePath, [string]$last)",
            "        $current = $last + 1",
            "    }",
            "    [IO.File]::WriteAllText($DonePath, 'done')",
            "    Add-Content -LiteralPath $LogPath -Value 'Parallel PNG conversion completed and temporary TIFF frames were removed.'",
            "    exit 0",
            "} catch {",
            "    Add-Content -LiteralPath $LogPath -Value ('PARALLEL PNG FAILED - ' + $_.Exception.Message)",
            "    [IO.File]::WriteAllText($FailPath, 'failed')",
            "    exit 14",
            "}"
        ].join("\r\n");

        // Single-file equivalent used for the WAV pass. A non-empty file must
        // keep the same size and timestamp for several checks before FFmpeg may
        // open it, because the audio aerender launcher can return early too.
        var waitFileScript = [
            "param(",
            "    [Parameter(Mandatory=$true)][string]$FilePath,",
            "    [Parameter(Mandatory=$true)][string]$LogPath,",
            "    [string]$FailurePath = '',",
            "    [string]$CancelPath = '',",
            "    [string]$ProgressPath = ''",
            ")",
            "$ErrorActionPreference = 'Stop'",
            "$previousSignature = $null",
            "$stablePasses = 0",
            "$lastProgress = [DateTime]::UtcNow",
            "$previousLength = [long]-1",
            "$previousProgress = ''",
            "while ($true) {",
            "    if ($CancelPath -and (Test-Path -LiteralPath $CancelPath)) { exit 13 }",
            "    if ($FailurePath -and (Test-Path -LiteralPath $FailurePath)) { exit 14 }",
            "    try {",
            "        if ($ProgressPath -and (Test-Path -LiteralPath $ProgressPath)) {",
            "            $progressNow = [string](Get-Content -LiteralPath $ProgressPath -Raw -ErrorAction SilentlyContinue)",
            "            if ($progressNow -ne $previousProgress) { $previousProgress = $progressNow; $lastProgress = [DateTime]::UtcNow }",
            "        }",
            "        if (Test-Path -LiteralPath $FilePath -PathType Leaf) {",
            "            $item = Get-Item -LiteralPath $FilePath",
            "            if ($item.Length -ne $previousLength) {",
            "                $previousLength = $item.Length",
            "                $lastProgress = [DateTime]::UtcNow",
            "            }",
            "",
            "            if ($item.Length -gt 0) {",
            "                $signature = [string]$item.Length + ':' + [string]$item.LastWriteTimeUtc.Ticks",
            "                if ($signature -eq $previousSignature) {",
            "                    $stablePasses++",
            "                } else {",
            "                    $previousSignature = $signature",
            "                    $stablePasses = 0",
            "                }",
            "",
            "                if ($stablePasses -ge 4) {",
            "                    Add-Content -LiteralPath $LogPath -Value ('Verified stable audio WAV ({0} bytes).' -f $item.Length)",
            "                    exit 0",
            "                }",
            "            }",
            "        }",
            "",
            "        if (([DateTime]::UtcNow - $lastProgress).TotalMinutes -ge 30) {",
            "            Add-Content -LiteralPath $LogPath -Value 'AUDIO RENDER FAILED - no WAV progress for 30 minutes.'",
            "            exit 12",
            "        }",
            "    } catch {",
            "        Add-Content -LiteralPath $LogPath -Value ('Audio verification warning: ' + $_.Exception.Message)",
            "    }",
            "",
            "    Start-Sleep -Milliseconds 1000",
            "}"
        ].join("\r\n");

        // Records only AfterFX.com processes created by this job. The snapshot
        // is taken immediately before aerender launches; the second invocation
        // subtracts that snapshot and writes the detached worker PIDs.
        var captureWorkersScript = [
            "param(",
            "    [Parameter(Mandatory=$true)][string]$OutputPath,",
            "    [string]$BeforePath = ''",
            ")",
            "$ErrorActionPreference = 'SilentlyContinue'",
            "$before = @()",
            "if ($BeforePath -and (Test-Path -LiteralPath $BeforePath)) {",
            "    $before = @(Get-Content -LiteralPath $BeforePath | ForEach-Object { $n = 0; if ([int]::TryParse([string]$_, [ref]$n)) { $n } })",
            "}",
            "$deadline = [DateTime]::UtcNow.AddSeconds($(if ($BeforePath) { 12 } else { 0 }))",
            "do {",
            "    $ids = @(Get-Process -Name 'AfterFX.com' -ErrorAction SilentlyContinue | Where-Object { $before -notcontains $_.Id } | Select-Object -ExpandProperty Id)",
            "    if ($ids.Count -gt 0 -or -not $BeforePath) {",
            "        Set-Content -LiteralPath $OutputPath -Value $ids -Encoding ASCII",
            "        exit 0",
            "    }",
            "    Start-Sleep -Milliseconds 250",
            "} while ([DateTime]::UtcNow -lt $deadline)",
            "Set-Content -LiteralPath $OutputPath -Value '' -Encoding ASCII",
            "exit 0"
        ].join("\r\n");

        // Direct H.264 has no numbered files to count. Read AE's local progress
        // log for the UI, then require a stable non-empty MP4 plus either the
        // final frame or termination of this job's tracked AE worker.
        var waitMovieScript = [
            "param(",
            "    [Parameter(Mandatory=$true)][string]$FilePath,",
            "    [Parameter(Mandatory=$true)][string]$LogPath,",
            "    [Parameter(Mandatory=$true)][string]$AeLogPath,",
            "    [Parameter(Mandatory=$true)][string]$ProgressPath,",
            "    [Parameter(Mandatory=$true)][int]$StartFrame,",
            "    [Parameter(Mandatory=$true)][int]$TotalFrames,",
            "    [Parameter(Mandatory=$true)][string]$WorkerIdsPath,",
            "    [Parameter(Mandatory=$true)][string]$CancelPath",
            ")",
            "$ErrorActionPreference = 'SilentlyContinue'",
            "$previousSignature = $null",
            "$stablePasses = 0",
            "$lastProgress = [DateTime]::UtcNow",
            "$lastReady = -1",
            "$previousLength = [long]-1",
            "while ($true) {",
            "    if (Test-Path -LiteralPath $CancelPath) { exit 13 }",
            "    $ready = 0",
            "    if (Test-Path -LiteralPath $AeLogPath) {",
            "        $text = Get-Content -LiteralPath $AeLogPath -Raw -ErrorAction SilentlyContinue",
            "        $matches = [regex]::Matches([string]$text, '\\((-?\\d+)\\):')",
            "        if ($matches.Count -gt 0) {",
            "            $frame = [int]$matches[$matches.Count - 1].Groups[1].Value",
            "            $ready = [Math]::Max(0, [Math]::Min($TotalFrames, $frame - $StartFrame + 1))",
            "        }",
            "    }",
            "    if ($ready -ne $lastReady) {",
            "        Set-Content -LiteralPath $ProgressPath -Value $ready -Encoding ASCII",
            "        $lastReady = $ready",
            "        $lastProgress = [DateTime]::UtcNow",
            "    }",
            "    $workerIds = @()",
            "    if (Test-Path -LiteralPath $WorkerIdsPath) {",
            "        $workerIds = @(Get-Content -LiteralPath $WorkerIdsPath | ForEach-Object { $n = 0; if ([int]::TryParse([string]$_, [ref]$n)) { $n } })",
            "    }",
            "    $activeWorkers = @($workerIds | Where-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })",
            "    if (Test-Path -LiteralPath $FilePath -PathType Leaf) {",
            "        $item = Get-Item -LiteralPath $FilePath",
            "        if ($item.Length -ne $previousLength) {",
            "            $previousLength = $item.Length",
            "            $lastProgress = [DateTime]::UtcNow",
            "        }",
            "        if ($item.Length -gt 0) {",
            "            $signature = [string]$item.Length + ':' + [string]$item.LastWriteTimeUtc.Ticks",
            "            if ($signature -eq $previousSignature) { $stablePasses++ } else { $previousSignature = $signature; $stablePasses = 0 }",
            "            $workerFinished = $workerIds.Count -gt 0 -and $activeWorkers.Count -eq 0",
            "            if ($stablePasses -ge 6 -and ($ready -ge $TotalFrames -or $workerFinished)) {",
            "                Set-Content -LiteralPath $ProgressPath -Value $TotalFrames -Encoding ASCII",
            "                Add-Content -LiteralPath $LogPath -Value ('Verified stable H.264 MP4 ({0} bytes).' -f $item.Length)",
            "                exit 0",
            "            }",
            "        }",
            "    }",
            "    if (([DateTime]::UtcNow - $lastProgress).TotalHours -ge 6) {",
            "        Add-Content -LiteralPath $LogPath -Value 'H.264 RENDER FAILED - no output progress for 6 hours.'",
            "        exit 12",
            "    }",
            "    Start-Sleep -Milliseconds 1000",
            "}"
        ].join("\r\n");

        // Independent visible terminal monitor. It reads only tiny local job
        // sidecars, so it survives AE closing and never scans the render folder.
        var terminalMonitorScript = [
            "param([Parameter(Mandatory=$true)][string]$ManifestPath)",
            "$ErrorActionPreference = 'SilentlyContinue'",
            "function Read-Manifest([string]$Path) {",
            "    $result = @{}",
            "    foreach ($line in (Get-Content -LiteralPath $Path -ErrorAction SilentlyContinue)) {",
            "        $eq = $line.IndexOf('=')",
            "        if ($eq -gt 0) { $result[$line.Substring(0, $eq)] = $line.Substring($eq + 1) }",
            "    }",
            "    return $result",
            "}",
            "function Has-Flag($Data, [string]$Key) {",
            "    $path = [string]$Data[$Key]",
            "    return $path.Length -gt 0 -and (Test-Path -LiteralPath $path)",
            "}",
            "function Format-Time([double]$Seconds) {",
            "    $seconds = [Math]::Max(0, [Math]::Round($Seconds))",
            "    $hours = [Math]::Floor($seconds / 3600)",
            "    $minutes = [Math]::Floor(($seconds % 3600) / 60)",
            "    $remain = $seconds % 60",
            "    if ($hours -gt 0) { return ('{0}:{1:00}:{2:00}' -f $hours, $minutes, $remain) }",
            "    return ('{0:00}:{1:00}' -f $minutes, $remain)",
            "}",
            "function Write-Fixed([string]$Text, [string]$Color, [int]$Width) {",
            "    if ($null -eq $Text) { $Text = '' }",
            "    if ($Text.Length -gt $Width) { $Text = $Text.Substring(0, [Math]::Max(1, $Width - 3)) + '...' }",
            "    Write-Host $Text.PadRight($Width) -ForegroundColor $Color",
            "}",
            "$data = Read-Manifest $ManifestPath",
            "if ($data.Count -eq 0) {",
            "    Write-Host 'Smart Render monitor could not read the job manifest.' -ForegroundColor Red",
            "    Read-Host 'Press Enter to close'",
            "    exit 1",
            "}",
            "$total = [Math]::Max(1, [int]$data['totalFrames'])",
            "$initial = [Math]::Max(0, [int]$data['initialCached'])",
            "$missingTotal = [Math]::Max(0, [int]$data['framesToRender'])",
            "$currentFramePath = [string]$data['currentFramePath']",
            "$mode = [string]$data['renderMode']",
            "$modeLabel = if ($mode -eq 'PARALLEL_PNG') { 'Parallel PNG' } elseif ($mode -eq 'FAST_MP4') { 'Fast MP4' } elseif ($mode -eq 'FAST_PNG') { 'Native PNG' } elseif ($mode -eq 'JPEG') { 'Resumable JPEG' } else { 'Resumable PNG' }",
            "$startMs = [double]$data['jobStartTime']",
            "$epoch = [DateTime]::SpecifyKind([datetime]'1970-01-01', [DateTimeKind]::Utc)",
            "$started = if ($startMs -gt 0) { $epoch.AddMilliseconds($startMs).ToLocalTime() } else { Get-Date }",
            "$rateStarted = $null",
            "$rateReady = 0",
            "$painted = $false",
            "try { [Console]::CursorVisible = $false } catch {}",
            "while ($true) {",
            "    $ready = 0",
            "    $progressPath = [string]$data['progressPath']",
            "    if ($progressPath.Length -gt 0 -and (Test-Path -LiteralPath $progressPath)) {",
            "        $value = 0",
            "        if ([int]::TryParse(([string](Get-Content -LiteralPath $progressPath -Raw)).Trim(), [ref]$value)) { $ready = $value }",
            "    } elseif ($mode -ne 'FAST_MP4') { $ready = $initial }",
            "    $ready = [Math]::Max(0, [Math]::Min($total, $ready))",
            "    $currentFrameText = '~--'",
            "    if ($currentFramePath.Length -gt 0 -and (Test-Path -LiteralPath $currentFramePath)) {",
            "        $currentValue = 0",
            "        if ([int]::TryParse(([string](Get-Content -LiteralPath $currentFramePath -Raw)).Trim(), [ref]$currentValue)) { $currentFrameText = '~' + [string]$currentValue }",
            "    }",
            "    $renderedMissing = [Math]::Max(0, [Math]::Min($missingTotal, $ready - $initial))",
            "    $remainingMissing = [Math]::Max(0, $missingTotal - $renderedMissing)",
            "    $percent = [Math]::Floor(($ready * 100.0) / $total)",
            "    $now = Get-Date",
            "    $elapsed = ($now - $started).TotalSeconds",
            "    if ($ready -gt $initial -and $null -eq $rateStarted) { $rateStarted = $now; $rateReady = $ready }",
            "    $fps = 0.0",
            "    $eta = 'calculating...'",
            "    if ($null -ne $rateStarted) {",
            "        $sampleSeconds = ($now - $rateStarted).TotalSeconds",
            "        $sampleFrames = [Math]::Max(0, $ready - $rateReady)",
            "        if ($sampleSeconds -ge 8 -and $sampleFrames -ge 15) {",
            "            $fps = $sampleFrames / $sampleSeconds",
            "            if ($fps -gt 0) { $eta = Format-Time (($total - $ready) / $fps) }",
            "        }",
            "    }",
            "    $terminal = $false",
            "    $statusColor = 'Cyan'",
            "    $hasRenderDone = Has-Flag $data 'renderDonePath'",
            "    $hasAudioStarted = Has-Flag $data 'audioStartedPath'",
            "    $hasEncodeStarted = Has-Flag $data 'encodeStartedPath'",
            "    if (Has-Flag $data 'donePath') { $stage = 'COMPLETE'; $statusColor = 'Green'; $ready = $total; $percent = 100; $terminal = $true }",
            "    elseif (Has-Flag $data 'cancelPath') { $stage = 'ENDED'; $statusColor = 'Yellow'; $terminal = $true }",
            "    elseif ((Has-Flag $data 'renderFailPath') -or (Has-Flag $data 'audioFailPath') -or (Has-Flag $data 'encodeFailPath')) { $stage = 'FAILED - open the log'; $statusColor = 'Red'; $terminal = $true }",
            "    elseif ($hasEncodeStarted) { $stage = 'Encoding MP4 + audio' }",
            "    elseif ($hasAudioStarted) { $stage = 'Rendering audio' }",
            "    elseif ($hasRenderDone) { $stage = 'Frames ready - preparing MP4' }",
            "    elseif (Has-Flag $data 'retryPath') { $stage = 'Retrying render' }",
            "    elseif ($mode -eq 'PARALLEL_PNG') { $stage = 'Rendering TIFF + converting PNG' }",
            "    elseif ($mode -eq 'FAST_MP4') { $stage = 'Rendering MP4 + audio' }",
            "    elseif ($mode -eq 'FAST_PNG') { $stage = 'Rendering PNG frames - MFR' }",
            "    elseif ($mode -eq 'JPEG') { $stage = 'Rendering JPEG frames' }",
            "    else { $stage = 'Rendering PNG frames' }",
            "    $barWidth = 42",
            "    $filled = [Math]::Max(0, [Math]::Min($barWidth, [Math]::Floor($percent * $barWidth / 100)))",
            "    $bar = '[' + ('#' * $filled) + ('-' * ($barWidth - $filled)) + ']'",
            "    $speedText = if ($fps -gt 0) { ('{0:N2} fps' -f $fps) } else { '-- fps' }",
            "    if ($hasRenderDone -or $hasAudioStarted -or $hasEncodeStarted -or $stage -eq 'COMPLETE') {",
            "        $frameLine = ('Frames  {0} / {1}   |   Frame sequence complete' -f $total, $total)",
            "    } elseif ($mode -ne 'FAST_MP4' -and $missingTotal -gt 0) {",
            "        $frameLine = ('Frames  {0} / {1}   |   Current {2}   |   Remaining {3} / {4}' -f $ready, $total, $currentFrameText, $remainingMissing, $missingTotal)",
            "    } else {",
            "        $frameLine = ('Frames  {0} / {1}' -f $ready, $total)",
            "    }",
            "    if ($terminal) {",
            "        $activityLine = ('Time    {0}   |   Status  {1}' -f (Format-Time $elapsed), $stage)",
            "    } elseif ($hasEncodeStarted) {",
            "        $activityLine = ('Time    {0}   |   Encoding MP4...' -f (Format-Time $elapsed))",
            "    } elseif ($hasAudioStarted) {",
            "        $activityLine = ('Time    {0}   |   Rendering audio...' -f (Format-Time $elapsed))",
            "    } elseif ($hasRenderDone) {",
            "        $activityLine = ('Time    {0}   |   Preparing MP4...' -f (Format-Time $elapsed))",
            "    } elseif ($mode -eq 'FAST_MP4') {",
            "        $activityLine = ('Time    {0}   |   Rendering MP4 + audio...' -f (Format-Time $elapsed))",
            "    } else {",
            "        $activityLine = ('Time    {0}   |   Speed  {1}   |   ETA  {2}' -f (Format-Time $elapsed), $speedText, $eta)",
            "    }",
            "    try { $width = [Math]::Max(72, [Console]::WindowWidth - 1) } catch { $width = 100 }",
            "    try { $Host.UI.RawUI.WindowTitle = 'Smart Render - ' + [string]$data['compName'] + ' - ' + $percent + '%' } catch {}",
            "    if (-not $painted) { Clear-Host; $painted = $true } else { try { [Console]::SetCursorPosition(0, 0) } catch { Clear-Host } }",
            "    Write-Fixed ('SMART RENDER  ' + [string]$data['compName']) 'White' $width",
            "    Write-Fixed ('Mode    ' + $modeLabel + '   |   Stage  ' + $stage) $statusColor $width",
            "    Write-Fixed '' 'Gray' $width",
            "    Write-Fixed ($bar + '  ' + $percent + '%') $statusColor $width",
            "    Write-Fixed $frameLine 'White' $width",
            "    Write-Fixed $activityLine 'White' $width",
            "    Write-Fixed '' 'Gray' $width",
            "    Write-Fixed ('Output  ' + [string]$data['finalOutputPath']) 'DarkGray' $width",
            "    Write-Fixed ('Log     ' + [string]$data['logPath']) 'DarkGray' $width",
            "    Write-Fixed '' 'Gray' $width",
            "    Write-Fixed 'Closing this terminal does not stop the render.' 'DarkGray' $width",
            "    Write-Fixed 'To stop it later: reopen Smart Render, Scan Render, then End Render.' 'DarkGray' $width",
            "    if ($terminal) {",
            "        try { [Console]::CursorVisible = $true } catch {}",
            "        Write-Host ''",
            "        Read-Host 'Press Enter to close this window'",
            "        exit 0",
            "    }",
            "    Start-Sleep -Seconds 1",
            "}"
        ].join("\r\n");

        var lines = [];
        lines.push("@echo off");
        lines.push("setlocal EnableExtensions EnableDelayedExpansion");
        lines.push("echo Smart Render started %date% %time% > " + q(log.fsName));
        lines.push("echo Project: " + q(projectPath) + " >> " + q(log.fsName));
        lines.push("echo Comp: " + q(comp.name) + " >> " + q(log.fsName));
        lines.push("echo Frames: " + range.start + "-" + range.end + " >> " + q(log.fsName));
        lines.push("echo Profile: " + profile.mode + " " + profile.pct + "%% >> " + q(log.fsName));
        lines.push("echo Quality: " + profile.quality + " / Resolution: " + profile.resolution + " >> " + q(log.fsName));
        lines.push("echo Render mode: " + renderMode + " >> " + q(log.fsName));
        if (!isDirectMp4) {
            lines.push("echo Frame format: " + frameExtension.toUpperCase() + " >> " + q(log.fsName));
            lines.push("echo Channels: " + (profile.includeAlpha ? "RGBA" : "RGB") + " >> " + q(log.fsName));
        }
        lines.push("echo Output template: " + q(selectedOutputTemplate) + " >> " + q(log.fsName));
        lines.push("echo CPU: " + cpu + "%% >> " + q(log.fsName));
        if (!isDirectMp4) {
            lines.push("echo MP4 CRF: " + crf + " >> " + q(log.fsName));
        }
        lines.push("echo MP4 output: " + q(mp4Path) + " >> " + q(log.fsName));
        lines.push("");

        var snapshotWorkersCommand =
            "powershell.exe -NoLogo -NoProfile -NonInteractive" +
            " -ExecutionPolicy Bypass" +
            " -File " + q(captureWorkersPs1.fsName) +
            " -OutputPath " + q(beforeWorkerIdFile.fsName);
        var captureWorkersCommand =
            "powershell.exe -NoLogo -NoProfile -NonInteractive" +
            " -ExecutionPolicy Bypass" +
            " -File " + q(captureWorkersPs1.fsName) +
            " -OutputPath " + q(workerIdFile.fsName) +
            " -BeforePath " + q(beforeWorkerIdFile.fsName);

        function converterCommandFor(
            segmentStart,
            segmentEnd,
            segmentDonePath,
            progressOffset
        ) {
            return "powershell.exe -NoLogo -NoProfile -NonInteractive" +
                " -ExecutionPolicy Bypass" +
                " -File " + q(convertPs1.fsName) +
                " -FFmpegPath " + q(ffmpeg.fsName) +
                " -TempFolder " + q(tempFrameFolder ? tempFrameFolder.fsName : jobFolder.fsName) +
                " -TempBase " + q(base) +
                " -OutputFolder " + q(outFolder.fsName) +
                " -OutputBase " + q(base) +
                " -StartFrame " + segmentStart +
                " -EndFrame " + segmentEnd +
                " -TempStartNumber 0" +
                " -LogPath " + q(log.fsName) +
                " -ProgressPath " + q(progressFile.fsName) +
                " -CurrentFramePath " + q(currentFrameFile.fsName) +
                " -CancelPath " + q(cancelledFile.fsName) +
                " -DonePath " + q(segmentDonePath) +
                " -FailPath " + q(renderFailFile.fsName) +
                " -JobStartTimeMs " + String(jobStartTimeMs) +
                " -ProgressOffset " + progressOffset +
                " -IncludeAlpha " + (profile.includeAlpha ? "1" : "0");
        }

        lines.push(snapshotWorkersCommand);

        // aerender.exe may return before its detached AfterFX.com process ends.
        // Verification, not the launcher exit code, is the completion signal.
        var aeCommand =
            q(aerender.fsName) +
            " -project " + q(projectPath) +
            " -comp " + q(comp.name) +
            " -s " + range.start +
            " -e " + range.end +
            " -RStemplate " + q(smartRenderTemplate) +
            " -OMtemplate " + q(selectedOutputTemplate) +
            " -output " + q(isDirectMp4 ? tempMp4Path : aeSequencePath) +
            " -mfr ON " + cpu +
            " -close DO_NOT_SAVE_CHANGES" +
            " -v ERRORS_AND_PROGRESS" +
            " -log " + q(aeLog.fsName);

        function aeCommandForSegment(segmentStart, segmentEnd, segmentLogPath) {
            return q(aerender.fsName) +
                " -project " + q(projectPath) +
                " -comp " + q(comp.name) +
                " -s " + segmentStart +
                " -e " + segmentEnd +
                " -RStemplate " + q(smartRenderTemplate) +
                " -OMtemplate " + q(selectedOutputTemplate) +
                " -output " + q(aeSequencePath) +
                " -mfr ON " + cpu +
                " -close DO_NOT_SAVE_CHANGES" +
                " -v ERRORS_AND_PROGRESS" +
                " -log " + q(segmentLogPath);
        }

        if (isDirectMp4) {
            lines.push("if exist " + q(tempMp4Path) + " del /Q " + q(tempMp4Path));
            lines.push("echo Rendering native H.264 + audio... >> " + q(log.fsName));
            lines.push("if exist " + q(cancelledFile.fsName) + " exit /b 13");
            lines.push("start \"\" /B " + captureWorkersCommand);
            lines.push(aeCommand);
            lines.push("set AE_EXIT=!ERRORLEVEL!");
            lines.push(captureWorkersCommand);
            lines.push("echo aerender launcher exit code: !AE_EXIT! >> " + q(log.fsName));
            lines.push("if not \"!AE_EXIT!\"==\"0\" (");
            lines.push("  echo H.264 RENDER FAILED - aerender launch error. >> " + q(log.fsName));
            lines.push("  echo failed > " + q(renderFailFile.fsName));
            lines.push("  exit /b 1");
            lines.push(")");

            var waitMovieCommand =
                "powershell.exe -NoLogo -NoProfile -NonInteractive" +
                " -ExecutionPolicy Bypass" +
                " -File " + q(waitMoviePs1.fsName) +
                " -FilePath " + q(tempMp4Path) +
                " -LogPath " + q(log.fsName) +
                " -AeLogPath " + q(aeLog.fsName) +
                " -ProgressPath " + q(progressFile.fsName) +
                " -StartFrame " + range.start +
                " -TotalFrames " + totalFrames +
                " -WorkerIdsPath " + q(workerIdFile.fsName) +
                " -CancelPath " + q(cancelledFile.fsName);

            lines.push(waitMovieCommand);
            lines.push("set WAIT_EXIT=!ERRORLEVEL!");
            lines.push("if not \"!WAIT_EXIT!\"==\"0\" (");
            lines.push("  if \"!WAIT_EXIT!\"==\"13\" exit /b 13");
            lines.push("  echo H.264 RENDER FAILED - verification exit code !WAIT_EXIT!. >> " + q(log.fsName));
            lines.push("  echo failed > " + q(renderFailFile.fsName));
            lines.push("  exit /b 1");
            lines.push(")");
            lines.push("if exist " + q(aeLog.fsName) + " type " + q(aeLog.fsName) + " >> " + q(log.fsName));
            lines.push("for /F \"usebackq\" %%P in (" + q(workerIdFile.fsName) + ") do taskkill.exe /PID %%P /T /F >nul 2>&1");
            lines.push("move /Y " + q(tempMp4Path) + " " + q(mp4Path) + " >> " + q(log.fsName) + " 2>&1");
            lines.push("if errorlevel 1 (");
            lines.push("  echo H.264 RENDER FAILED - could not move final MP4. >> " + q(log.fsName));
            lines.push("  echo failed > " + q(renderFailFile.fsName));
            lines.push("  exit /b 1");
            lines.push(")");
            lines.push("echo render_done > " + q(renderDoneFile.fsName));
            lines.push("echo audio_done > " + q(audioDoneFile.fsName));
            lines.push("echo encode_done > " + q(encodeDoneFile.fsName));
            lines.push("echo Native H.264 + audio completed %date% %time% >> " + q(log.fsName));
            lines.push("");
        } else if (isParallelPng) {
            lines.push("echo Resumable Parallel PNG: " + initialCached + " cached, " + framesToRender + " missing in " + parallelMissingRanges.length + " segment(s). >> " + q(log.fsName));
            lines.push("echo " + initialCached + " > " + q(progressFile.fsName));

            var completedBeforeSegment = initialCached;

            for (var segmentIndex = 0;
                 segmentIndex < parallelMissingRanges.length;
                 segmentIndex++) {
                var segment = parallelMissingRanges[segmentIndex];
                var segmentNumber = segmentIndex + 1;
                var segmentLength = segment.end - segment.start + 1;
                var segmentDoneFile = new File(
                    jobFolder.fsName +
                    "\\CONVERT_SEGMENT_" + segmentNumber + "_DONE.flag"
                );
                var segmentAeLog = new File(
                    jobFolder.fsName +
                    "\\aerender_segment_" + segmentNumber + ".log"
                );
                var segmentConverterCommand = converterCommandFor(
                    segment.start,
                    segment.end,
                    segmentDoneFile.fsName,
                    completedBeforeSegment
                );
                var segmentAeCommand = aeCommandForSegment(
                    segment.start,
                    segment.end,
                    segmentAeLog.fsName
                );
                var segmentAttemptVar = "SEGMENT_" + segmentNumber + "_ATTEMPT";
                var segmentLabel = "PARALLEL_SEGMENT_" + segmentNumber;

                lines.push("echo. >> " + q(log.fsName));
                lines.push("echo Segment " + segmentNumber + "/" + parallelMissingRanges.length + ": frames " + segment.start + "-" + segment.end + " (" + segmentLength + " missing) >> " + q(log.fsName));
                lines.push("echo " + segment.start + " > " + q(currentFrameFile.fsName));
                lines.push("start \"\" /B " + segmentConverterCommand);
                lines.push("set " + segmentAttemptVar + "=0");
                lines.push(":" + segmentLabel);
                lines.push("set /A " + segmentAttemptVar + "+=1");
                lines.push("if exist " + q(cancelledFile.fsName) + " exit /b 13");
                lines.push("echo Rendering segment " + segmentNumber + " attempt !" + segmentAttemptVar + "! of 4... >> " + q(log.fsName));
                lines.push("start \"\" /B " + captureWorkersCommand);
                lines.push(segmentAeCommand);
                lines.push("set AE_EXIT=!ERRORLEVEL!");
                lines.push(captureWorkersCommand);
                lines.push("if exist " + q(segmentAeLog.fsName) + " type " + q(segmentAeLog.fsName) + " >> " + q(log.fsName));
                lines.push("echo Segment " + segmentNumber + " aerender exit code: !AE_EXIT! >> " + q(log.fsName));
                lines.push("if exist " + q(segmentDoneFile.fsName) + " set AE_EXIT=0");
                lines.push("if not \"!AE_EXIT!\"==\"0\" (");
                lines.push("  if !" + segmentAttemptVar + "! LSS 4 (");
                lines.push("    for /F \"usebackq\" %%P in (" + q(workerIdFile.fsName) + ") do taskkill.exe /PID %%P /T /F >nul 2>&1");
                lines.push("    echo !" + segmentAttemptVar + "! > " + q(retryFile.fsName));
                lines.push("    timeout.exe /T 3 /NOBREAK >nul");
                lines.push("    goto " + segmentLabel);
                lines.push("  )");
                lines.push("  echo PARALLEL PNG FAILED - segment " + segmentNumber + " retry limit reached. >> " + q(log.fsName));
                lines.push("  echo failed > " + q(renderFailFile.fsName));
                lines.push("  exit /b 1");
                lines.push(")");

                var waitSegmentConvertCommand =
                    "powershell.exe -NoLogo -NoProfile -NonInteractive" +
                    " -ExecutionPolicy Bypass" +
                    " -File " + q(waitFilePs1.fsName) +
                    " -FilePath " + q(segmentDoneFile.fsName) +
                    " -LogPath " + q(log.fsName) +
                    " -FailurePath " + q(renderFailFile.fsName) +
                    " -CancelPath " + q(cancelledFile.fsName) +
                    " -ProgressPath " + q(progressFile.fsName);

                lines.push(waitSegmentConvertCommand);
                lines.push("set CONVERT_WAIT_EXIT=!ERRORLEVEL!");
                lines.push("if not \"!CONVERT_WAIT_EXIT!\"==\"0\" (");
                lines.push("  for /F \"usebackq\" %%P in (" + q(workerIdFile.fsName) + ") do taskkill.exe /PID %%P /T /F >nul 2>&1");
                lines.push("  if \"!CONVERT_WAIT_EXIT!\"==\"13\" exit /b 13");
                lines.push("  echo PARALLEL PNG FAILED - segment " + segmentNumber + " conversion wait failed. >> " + q(log.fsName));
                lines.push("  echo failed > " + q(renderFailFile.fsName));
                lines.push("  exit /b 14");
                lines.push(")");
                lines.push("for /F \"usebackq\" %%P in (" + q(workerIdFile.fsName) + ") do taskkill.exe /PID %%P /T /F >nul 2>&1");
                lines.push("echo Segment " + segmentNumber + " completed. >> " + q(log.fsName));

                completedBeforeSegment += segmentLength;
            }

            lines.push("if exist " + q(retryFile.fsName) + " del /Q " + q(retryFile.fsName));
            lines.push("echo convert_done > " + q(convertDoneFile.fsName));

            var parallelVerifyCommand =
                "powershell.exe -NoLogo -NoProfile -NonInteractive" +
                " -ExecutionPolicy Bypass" +
                " -File " + q(waitPs1.fsName) +
                " -FolderPath " + q(outFolder.fsName) +
                " -BaseName " + q(base) +
                " -StartFrame " + range.start +
                " -EndFrame " + range.end +
                " -LogPath " + q(log.fsName) +
                " -ProgressPath " + q(progressFile.fsName) +
                " -Extension " + q(frameExtension) +
                " -ProgressMode " + q("VALID") +
                " -JobStartTimeMs " + String(jobStartTimeMs) +
                " -CancelPath " + q(cancelledFile.fsName) +
                " -FailurePath " + q(renderFailFile.fsName);

            lines.push("echo Verifying complete PNG sequence... >> " + q(log.fsName));
            lines.push(parallelVerifyCommand);
            lines.push("set WAIT_EXIT=!ERRORLEVEL!");
            lines.push("if not \"!WAIT_EXIT!\"==\"0\" (");
            lines.push("  if \"!WAIT_EXIT!\"==\"13\" exit /b 13");
            lines.push("  echo PARALLEL PNG FAILED - final sequence verification failed. >> " + q(log.fsName));
            lines.push("  echo failed > " + q(renderFailFile.fsName));
            lines.push("  exit /b 1");
            lines.push(")");
            lines.push("if exist " + q(tempFrameFolder.fsName) + " rmdir /S /Q " + q(tempFrameFolder.fsName));
            lines.push("echo render_done > " + q(renderDoneFile.fsName));
            lines.push("echo Resumable Parallel PNG sequence completed and verified %date% %time% >> " + q(log.fsName));
            lines.push("");
        } else {
            lines.push("set RENDER_ATTEMPT=0");
            lines.push("set MAX_RENDER_ATTEMPTS=4");
            lines.push(":RENDER_ATTEMPT");
            lines.push("set /A RENDER_ATTEMPT+=1");
            lines.push("echo Frame render attempt !RENDER_ATTEMPT! of !MAX_RENDER_ATTEMPTS! %date% %time% >> " + q(log.fsName));
            lines.push("if exist " + q(cancelledFile.fsName) + " exit /b 13");
            lines.push("for %%F in (" + q(outFolder.fsName + "\\" + base + "_*." + frameExtension) + ") do if exist \"%%~fF\" if %%~zF EQU 0 (");
            lines.push("  echo Removing incomplete zero-byte frame: %%~nxF >> " + q(log.fsName));
            lines.push("  del /Q \"%%~fF\" >nul 2>&1");
            lines.push(")");
            lines.push("start \"\" /B " + captureWorkersCommand);
            lines.push(aeCommand);
            lines.push("set AE_EXIT=!ERRORLEVEL!");
            lines.push(captureWorkersCommand);
            lines.push("echo aerender launcher exit code: !AE_EXIT! >> " + q(log.fsName));
            lines.push("if not \"!AE_EXIT!\"==\"0\" (");
            lines.push("  if !RENDER_ATTEMPT! LSS !MAX_RENDER_ATTEMPTS! (");
            lines.push("    for /F \"usebackq\" %%P in (" + q(workerIdFile.fsName) + ") do taskkill.exe /PID %%P /T /F >nul 2>&1");
            lines.push("    echo !RENDER_ATTEMPT! > " + q(retryFile.fsName));
            lines.push("    timeout.exe /T 3 /NOBREAK >nul");
            lines.push("    goto RENDER_ATTEMPT");
            lines.push("  )");
            lines.push("  echo RENDER FAILED - retry limit reached. >> " + q(log.fsName));
            lines.push("  echo failed > " + q(renderFailFile.fsName));
            lines.push("  exit /b 1");
            lines.push(")");
            lines.push("echo aerender returned; verifying complete " + frameExtension.toUpperCase() + " sequence... >> " + q(log.fsName));

            var waitCommand =
                "powershell.exe -NoLogo -NoProfile -NonInteractive" +
                " -ExecutionPolicy Bypass" +
                " -File " + q(waitPs1.fsName) +
                " -FolderPath " + q(outFolder.fsName) +
                " -BaseName " + q(base) +
                " -StartFrame " + range.start +
                " -EndFrame " + range.end +
                " -LogPath " + q(log.fsName) +
                " -ProgressPath " + q(progressFile.fsName) +
                " -Extension " + q(frameExtension) +
                " -ProgressMode " + q(isFullOverwrite ? "TOUCHED" : "VALID") +
                " -JobStartTimeMs " + String(jobStartTimeMs) +
                " -CancelPath " + q(cancelledFile.fsName) +
                " -FailurePath " + q(renderFailFile.fsName);

            lines.push(waitCommand);
            lines.push("set WAIT_EXIT=!ERRORLEVEL!");
            lines.push("if \"!WAIT_EXIT!\"==\"12\" (");
            lines.push("  if !RENDER_ATTEMPT! LSS !MAX_RENDER_ATTEMPTS! (");
            lines.push("    for /F \"usebackq\" %%P in (" + q(workerIdFile.fsName) + ") do taskkill.exe /PID %%P /T /F >nul 2>&1");
            lines.push("    echo !RENDER_ATTEMPT! > " + q(retryFile.fsName));
            lines.push("    echo AUTO-RESUME: frame render stalled; restarting with cached frames. >> " + q(log.fsName));
            lines.push("    timeout.exe /T 3 /NOBREAK >nul");
            lines.push("    goto RENDER_ATTEMPT");
            lines.push("  )");
            lines.push(")");
            lines.push("if not \"!WAIT_EXIT!\"==\"0\" (");
            lines.push("  if \"!WAIT_EXIT!\"==\"13\" exit /b 13");
            lines.push("  echo RENDER FAILED - sequence verification exit code !WAIT_EXIT!. >> " + q(log.fsName));
            lines.push("  echo failed > " + q(renderFailFile.fsName));
            lines.push("  exit /b 1");
            lines.push(")");
            lines.push("if exist " + q(aeLog.fsName) + " type " + q(aeLog.fsName) + " >> " + q(log.fsName));
            lines.push("if exist " + q(retryFile.fsName) + " del /Q " + q(retryFile.fsName));
            lines.push("echo render_done > " + q(renderDoneFile.fsName));
            lines.push("echo AE frame sequence completed and verified %date% %time% >> " + q(log.fsName));
            lines.push("for /F \"usebackq\" %%P in (" + q(workerIdFile.fsName) + ") do taskkill.exe /PID %%P /T /F >nul 2>&1");
            lines.push("");
        }

        if (makeMP4 && !isDirectMp4) {
            // Image sequences cannot contain audio, so render the comp's mix to
            // a temporary WAV using the same frame range before running FFmpeg.
            lines.push("echo audio_rendering > " + q(audioStartedFile.fsName));
            lines.push("echo Rendering composition audio... >> " + q(log.fsName));
            lines.push("if exist " + q(audioWav.fsName) + " del /Q " + q(audioWav.fsName));

            var audioCommand =
                q(aerender.fsName) +
                " -project " + q(projectPath) +
                " -comp " + q(comp.name) +
                " -s " + range.start +
                " -e " + range.end +
                " -RStemplate " + q(templates.audioRenderTemplate) +
                " -OMtemplate " + q(templates.audioTemplate) +
                " -output " + q(audioWav.fsName) +
                " -mfr OFF " + cpu +
                " -v ERRORS_AND_PROGRESS" +
                " -log " + q(audioLog.fsName);

            lines.push(audioCommand);
            lines.push("set AUDIO_EXIT=%ERRORLEVEL%");
            lines.push(captureWorkersCommand);
            lines.push("if exist " + q(audioLog.fsName) + " type " + q(audioLog.fsName) + " >> " + q(log.fsName));
            lines.push("echo audio aerender exit code: %AUDIO_EXIT% >> " + q(log.fsName));
            lines.push("if exist " + q(audioLog.fsName) + " findstr /I /C:\"Skip Existing Files\" " + q(audioLog.fsName) + " >nul");
            lines.push("if not errorlevel 1 (");
            lines.push("  echo AUDIO RENDER FAILED - incompatible Multi-Machine render settings >> " + q(log.fsName));
            lines.push("  echo failed > " + q(audioFailFile.fsName));
            lines.push("  exit /b 6");
            lines.push(")");
            lines.push("if not \"%AUDIO_EXIT%\"==\"0\" (");
            lines.push("  echo AUDIO RENDER FAILED >> " + q(log.fsName));
            lines.push("  echo failed > " + q(audioFailFile.fsName));
            lines.push("  exit /b 6");
            lines.push(")");
            lines.push("echo audio aerender returned; waiting for stable WAV... >> " + q(log.fsName));

            var waitAudioCommand =
                "powershell.exe -NoLogo -NoProfile -NonInteractive" +
                " -ExecutionPolicy Bypass" +
                " -File " + q(waitFilePs1.fsName) +
                " -FilePath " + q(audioWav.fsName) +
                " -LogPath " + q(log.fsName);

            lines.push(waitAudioCommand);
            lines.push("set AUDIO_WAIT_EXIT=%ERRORLEVEL%");
            lines.push("if not \"%AUDIO_WAIT_EXIT%\"==\"0\" (");
            lines.push("  echo AUDIO RENDER FAILED - WAV verification exit code: %AUDIO_WAIT_EXIT% >> " + q(log.fsName));
            lines.push("  echo failed > " + q(audioFailFile.fsName));
            lines.push("  exit /b 6");
            lines.push(")");
            lines.push("echo audio_done > " + q(audioDoneFile.fsName));
            lines.push("echo AE audio completed and verified %date% %time% >> " + q(log.fsName));
            lines.push("for /F \"usebackq\" %%P in (" + q(workerIdFile.fsName) + ") do taskkill.exe /PID %%P /T /F >nul 2>&1");
            lines.push("");

            lines.push("echo. >> " + q(log.fsName));
            lines.push("echo encoding > " + q(encodeStartedFile.fsName));
            lines.push("echo Encoding H.264 + AAC MP4... >> " + q(log.fsName));

            // In a .bat file, %% is required so FFmpeg receives %05d.
            var ffPatternForBat = ffSequencePath.replace("%05d", "%%05d");

            // Remove only a stale temporary encode. Keep the previous final MP4
            // untouched until the new encode succeeds.
            lines.push(
                "if exist " + q(tempMp4Path) +
                " del /Q " + q(tempMp4Path)
            );

            var ffCommand =
                q(ffmpeg.fsName) +
                " -hide_banner" +
                " -y" +
                " -f image2" +
                " -framerate " + fps +
                " -start_number " + range.start +
                " -i " + q(ffPatternForBat) +
                " -i " + q(audioWav.fsName) +
                " -frames:v " + totalFrames +
                // yuv420p/H.264 needs even dimensions. Draft/Third renders can
                // occasionally produce an odd width or height, so pad by at
                // most one pixel instead of failing the entire encode.
                " -vf " + q("pad=ceil(iw/2)*2:ceil(ih/2)*2") +
                " -map 0:v:0" +
                " -map 1:a:0" +
                " -c:v libx264" +
                " -preset medium" +
                " -crf " + crf +
                " -pix_fmt yuv420p" +
                " -c:a aac" +
                " -b:a 320k" +
                " -af apad" +
                " -shortest" +
                " -movflags +faststart " +
                q(tempMp4Path) +
                " >> " + q(log.fsName) + " 2>&1";

            lines.push(ffCommand);
            lines.push("if errorlevel 1 (");
            lines.push("  echo ENCODE FAILED >> " + q(log.fsName));
            lines.push("  echo failed > " + q(encodeFailFile.fsName));
            lines.push("  exit /b 2");
            lines.push(")");

            // FFmpeg must actually have created a temporary MP4.
            lines.push("if not exist " + q(tempMp4Path) + " (");
            lines.push("  echo ENCODE FAILED - MP4 WAS NOT CREATED >> " + q(log.fsName));
            lines.push("  echo failed > " + q(encodeFailFile.fsName));
            lines.push("  exit /b 3");
            lines.push(")");

            // Also reject a zero-byte output. This prevents DONE.flag from ever
            // being written for an empty/broken encode.
            lines.push("for %%A in (" + q(tempMp4Path) + ") do set MP4SIZE=%%~zA");
            lines.push("if not defined MP4SIZE (");
            lines.push("  echo ENCODE FAILED - COULD NOT READ MP4 SIZE >> " + q(log.fsName));
            lines.push("  echo failed > " + q(encodeFailFile.fsName));
            lines.push("  exit /b 3");
            lines.push(")");
            lines.push("if %MP4SIZE% LEQ 0 (");
            lines.push("  echo ENCODE FAILED - MP4 IS EMPTY >> " + q(log.fsName));
            lines.push("  echo failed > " + q(encodeFailFile.fsName));
            lines.push("  exit /b 3");
            lines.push(")");

            // Replace the old final MP4 only after the new encode is valid.
            lines.push(
                "move /Y " + q(tempMp4Path) + " " + q(mp4Path) +
                " >> " + q(log.fsName) + " 2>&1"
            );
            lines.push("if errorlevel 1 (");
            lines.push("  echo ENCODE FAILED - COULD NOT MOVE FINAL MP4 >> " + q(log.fsName));
            lines.push("  echo failed > " + q(encodeFailFile.fsName));
            lines.push("  exit /b 4");
            lines.push(")");

            lines.push("if not exist " + q(mp4Path) + " (");
            lines.push("  echo ENCODE FAILED - FINAL MP4 IS MISSING >> " + q(log.fsName));
            lines.push("  echo failed > " + q(encodeFailFile.fsName));
            lines.push("  exit /b 5");
            lines.push(")");

            // The WAV is an intermediate only. Keep it on failure for
            // diagnosis, but remove it after a verified MP4 is in place.
            lines.push("if exist " + q(audioWav.fsName) + " del /Q " + q(audioWav.fsName));
            lines.push("echo encode_done > " + q(encodeDoneFile.fsName));
            lines.push("echo MP4 encode completed %date% %time% >> " + q(log.fsName));
        }

        lines.push("");
        lines.push("echo Smart Render completed %date% %time% >> " + q(log.fsName));
        lines.push("echo done > " + q(doneFile.fsName));
        lines.push("exit /b 0");

        try {
            writeTextFile(waitPs1, waitScript);
            writeTextFile(waitFilePs1, waitFileScript);
            writeTextFile(waitMoviePs1, waitMovieScript);
            writeTextFile(captureWorkersPs1, captureWorkersScript);
            writeTextFile(convertPs1, convertTiffScript);
            writeTextFile(monitorPs1, terminalMonitorScript);
            writeTextFile(bat, lines.join("\r\n"));

            var compIdForManifest = "";
            try {
                compIdForManifest = String(comp.id);
            } catch (manifestCompIdErr) {}

            writeJobManifest(manifestFile, {
                projectPath: projectPath,
                compName: comp.name,
                compId: compIdForManifest,
                outputFolder: outFolder.fsName,
                outputBase: outputBase,
                baseName: base,
                startFrame: range.start,
                endFrame: range.end,
                totalFrames: totalFrames,
                makeMP4: makeMP4 ? "1" : "0",
                qualityMode: profile.mode,
                resolutionPct: profile.pct,
                includeAlpha: profile.includeAlpha ? "1" : "0",
                renderMode: renderMode,
                frameExtension: frameExtension,
                crf: crf,
                initialCached: initialCached,
                framesToRender: framesToRender,
                progressPath: progressFile.fsName,
                currentFramePath: currentFrameFile.fsName,
                renderDonePath: renderDoneFile.fsName,
                retryPath: retryFile.fsName,
                audioStartedPath: audioStartedFile.fsName,
                audioDonePath: audioDoneFile.fsName,
                encodeStartedPath: encodeStartedFile.fsName,
                encodeDonePath: encodeDoneFile.fsName,
                donePath: doneFile.fsName,
                renderFailPath: renderFailFile.fsName,
                audioFailPath: audioFailFile.fsName,
                encodeFailPath: encodeFailFile.fsName,
                processIdPath: processIdFile.fsName,
                workerIdPath: workerIdFile.fsName,
                cancelPath: cancelledFile.fsName,
                jobStartTime: jobStartTimeMs,
                logPath: log.fsName,
                aeLogPath: aeLog.fsName,
                finalOutputPath: mp4Path,
                jobFolder: jobFolder.fsName
            });

            // Launch the hidden batch through WMI so its root cmd.exe PID can
            // be recorded. END ACTIVE RENDER later terminates only this tree.
            var batForVbs = bat.fsName.replace(/"/g, '""');
            var pidForVbs = processIdFile.fsName.replace(/"/g, '""');
            var failForVbs = renderFailFile.fsName.replace(/"/g, '""');
            var logForVbs = log.fsName.replace(/"/g, '""');

            var vbsText =
                'On Error Resume Next\r\n' +
                'Set Wmi = GetObject("winmgmts:\\\\.\\root\\cimv2")\r\n' +
                'Set Startup = Wmi.Get("Win32_ProcessStartup").SpawnInstance_\r\n' +
                'Startup.ShowWindow = 0\r\n' +
                'Set Process = Wmi.Get("Win32_Process")\r\n' +
                'Command = "cmd.exe /d /s /c " & Chr(34) & Chr(34) & "' +
                batForVbs +
                '" & Chr(34) & Chr(34)\r\n' +
                'Result = Process.Create(Command, Null, Startup, ProcessId)\r\n' +
                'Set Fso = CreateObject("Scripting.FileSystemObject")\r\n' +
                'If Result = 0 Then\r\n' +
                '  Set PidOut = Fso.CreateTextFile("' + pidForVbs + '", True)\r\n' +
                '  PidOut.Write CStr(ProcessId)\r\n' +
                '  PidOut.Close\r\n' +
                'Else\r\n' +
                '  Set FailOut = Fso.CreateTextFile("' + failForVbs + '", True)\r\n' +
                '  FailOut.Write "failed"\r\n' +
                '  FailOut.Close\r\n' +
                '  Set LogOut = Fso.OpenTextFile("' + logForVbs + '", 8, True)\r\n' +
                '  LogOut.WriteLine "BACKGROUND LAUNCH FAILED - WMI code: " & CStr(Result)\r\n' +
                '  LogOut.Close\r\n' +
                'End If\r\n';

            writeTextFile(vbs, vbsText);

            var monitorCommand =
                'powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File ' +
                q(monitorPs1.fsName) +
                ' -ManifestPath ' + q(manifestFile.fsName);
            var monitorCommandForVbs = monitorCommand.replace(/"/g, '""');
            var monitorVbsText =
                'On Error Resume Next\r\n' +
                'Set Shell = CreateObject("WScript.Shell")\r\n' +
                'Shell.Run "' + monitorCommandForVbs + '", 1, False\r\n';

            writeTextFile(monitorVbs, monitorVbsText);

        } catch (writeErr) {
            removeJobManifest(manifestFile ? manifestFile.fsName : "");
            alert(writeErr.toString());
            return;
        }

        // Launch hidden and immediately return control to the main AE UI.
        var launched = false;
        try {
            launched = vbs.execute();
        } catch (launchErr) {
            launched = false;
        }

        if (!launched) {
            removeJobManifest(manifestFile ? manifestFile.fsName : "");
            alert("Could not start the background render process.");
            return;
        }

        // The monitor is deliberately a separate visible process. Closing AE
        // or closing the palette does not close it or the background render.
        var monitorLaunched = false;
        try {
            monitorLaunched = monitorVbs.execute();
        } catch (monitorLaunchErr) {
            monitorLaunched = false;
        }

        if (!monitorLaunched) {
            statusText.text = "Render started  \u2022  terminal unavailable";
        }

        renderBtn.enabled = false;
        refreshCompBtn.enabled = false;
        deleteRangeBtn.enabled = false;
        clearBtn.enabled = false;
        draftCheck.enabled = false;
        finalCheck.enabled = false;
        resolutionSlider.enabled = false;
        renderModeDrop.enabled = false;
        alphaCheck.enabled = false;
        crfSlider.enabled = false;
        incrementMp4Check.enabled = false;

        forceEndBtn.enabled = true;
        scanRenderBtn.enabled = false;
        activeJobText.text = compactButtonName(comp.name, 34) + "  \u2022  " +
            (isDirectMp4 ? "MP4" : frameExtension.toUpperCase());
        jobTimeText.text =
            "Time 00:00  \u2022  ETA calculating...";

        var initialPercent = Math.floor(
            (initialCached / totalFrames) * 100
        );

        if (initialPercent < 0) initialPercent = 0;
        if (initialPercent > 100) initialPercent = 100;

        progressBar.value = initialPercent;
        setProgressLineComplete(false);
        progressText.text =
            initialCached + " / " + totalFrames +
            " frames  \u2022  " + initialPercent + "%";

        if (isDirectMp4) {
            statusText.text = "Rendering MP4 + audio...";
        } else if (framesToRender > 0 && initialCached > 0) {
            statusText.text =
                frameExtension.toUpperCase() + "  \u2022  " +
                framesToRender + " missing";
        } else if (framesToRender > 0) {
            statusText.text =
                "Rendering " + frameExtension.toUpperCase() + " frames...";
        } else {
            statusText.text =
                frameExtension.toUpperCase() + " cached  \u2022  verifying";
        }

        if (!monitorLaunched) {
            statusText.text += "  \u2022  terminal unavailable";
        }

        $.global.__SMART_RENDER_FLOATING_STATE__ = {
            donePath: doneFile.fsName,
            renderFailPath: renderFailFile.fsName,
            audioFailPath: audioFailFile.fsName,
            encodeFailPath: encodeFailFile.fsName,
            processIdPath: processIdFile.fsName,
            workerIdPath: workerIdFile.fsName,
            cancelPath: cancelledFile.fsName,
            projectPath: projectPath,
            jobCompName: comp.name,
            startTimeMs: jobStartTimeMs,

            outputFolder: outFolder.fsName,
            baseName: base,
            startFrame: range.start,
            endFrame: range.end,
            totalFrames: totalFrames,
            renderMode: renderMode,
            frameExtension: frameExtension,
            initialCached: initialCached,
            framesToRender: framesToRender,
            expectedWrites: expectedWrites,
            baseline: baseline,
            progressPath: progressFile.fsName,
            currentFramePath: currentFrameFile.fsName,
            lastReadyFrames: initialCached,
            lastFullScanMs: jobStartTimeMs,
            renderDonePath: renderDoneFile.fsName,
            retryPath: retryFile.fsName,
            audioStartedPath: audioStartedFile.fsName,
            audioDonePath: audioDoneFile.fsName,
            encodeStartedPath: encodeStartedFile.fsName,
            encodeDonePath: encodeDoneFile.fsName,

            progress: progressBar,
            progressText: progressText,
            status: statusText,
            activeJobText: activeJobText,
            jobTimeText: jobTimeText,
            button: renderBtn,
            deleteRangeButton: deleteRangeBtn,
            clearButton: clearBtn,
            draftCheck: draftCheck,
            finalCheck: finalCheck,
            resolutionSlider: resolutionSlider,
            renderModeDrop: renderModeDrop,
            alphaCheck: alphaCheck,
            crfSlider: crfSlider,
            incrementMp4Check: incrementMp4Check,
            forceEndButton: forceEndBtn,
            scanRenderButton: scanRenderBtn,
            makeMP4: makeMP4,
            manifestPath: manifestFile ? manifestFile.fsName : ""
        };

        app.scheduleTask(
            "$.global.__smartRenderFloatingPoll()",
            750,
            false
        );
    }

    // No external process is called while opening the UI.
    // FFmpeg is resolved only when BACKGROUND RENDER is clicked.

    win.onActivate = refreshUI;

    win.onClose = function() {
        // aerender + FFmpeg keep running after the UI closes. The per-job
        // manifest lets a reopened palette reconnect through Scan Active Render.
        $.global.__SMART_RENDER_FLOATING_STATE__ = null;
        try { batchWin.close(); } catch (batchCloseErr) {}
        return true;
    };

    // Pull the retained working queue and every named list for this project.
    try {
        loadBatchDocAtStartup();
    } catch (batchLoadErr) {}
    rebuildBatchRows();

    refreshUI();
    win.center();
    win.show();

})();
