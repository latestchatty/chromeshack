import React, { memo, useRef, useState } from "react";
import { getState } from "./actions";
import { copyToClipboard, exportSettings, importSettings } from "./helpers";
import { useStore } from "./popupStore";

const ImportExport = memo(() => {
  const store = useStore() as PopupState;
  const dispatch = store.dispatch;

  const [fieldBox, setFieldBox] = useState("");
  const [importing, setImporting] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>();

  const validateImport = (value: string) => {
    (async () => {
      const result = await importSettings(value);
      if (result) setFieldBox(result);
      else if (result === null) {
        const freshState = await getState();
        // overwrite our state from the local settings store
        dispatch({ type: "INIT", payload: freshState });
        // reset our form state
        setFieldBox("");
        setImporting(false);
        alert("Successfully imported settings");
      } else
        console.error("Something went wrong parsing settings import:", value);
    })();
  };
  const validateExport = () => {
    try {
      (async () => {
        const exported = await exportSettings();
        setFieldBox(exported);
        if (
          textRef.current &&
          (await copyToClipboard(textRef.current, exported))
        )
          alert("Exported settings to clipboard");
      })();
    } catch (e) {
      console.error("Something went wrong when validating export:", e);
    }
  };

  const handleImportExportBtn = () => {
    if (importing) validateImport(fieldBox);
    else validateExport();
  };
  const handleImportExportField = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const _this = e.target as HTMLTextAreaElement;
    if (_this.value.length === 0) setImporting(false);
    else setImporting(true);
    setFieldBox(_this.value);
  };

  return (
    <>
      <div className="import_export_area">
        <textarea
          id="import_export_field"
          placeholder="Paste a settings string here for import or click Export..."
          value={fieldBox}
          onChange={handleImportExportField}
          ref={textRef}
        />
      </div>
      <button id="import_export_btn" onClick={handleImportExportBtn}>
        {importing ? "Import" : "Export to clipboard"}
      </button>
    </>
  );
});

export { ImportExport };
