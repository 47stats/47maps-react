import { useState } from "react";
import {
  Drawer,
  DarkThemeToggle,
  Button,
  Checkbox,
  Label,
  Modal,
  FileInput,
  Alert,
} from "flowbite-react";
import {
  HiOutlineCog,
  HiOutlineDownload,
  HiOutlineUpload,
} from "react-icons/hi";
import { FaRegPlayCircle, FaRegQuestionCircle, FaGithub } from "react-icons/fa";
import { DrawerPropType } from "../base-drawer";
import {
  downloadStorageAsJson,
  importStorageFromJson,
  isRestoreOnStartupEnabled,
  setRestoreOnStartupEnabled,
} from "../../../utils";
import {
  CHOROPLETH_ONBOARDING_KEY,
  RESTART_CHOROPLETH_ONBOARDING_EVENT,
} from "../../navbar/onboarding";
import { useConfig } from "../../../contexts/ConfigContext";

export const SettingsDrawer = (props: DrawerPropType) => {
  const config = useConfig();
  const helpUrl = config.helpUrl;
  const handleClose = props.handleClose;
  const isOpen = props.visible;
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const result = await importStorageFromJson(file, {
      maxMarketareaItems: config.marketareaMaxItems,
    });

    setIsUploading(false);

    if (result.success) {
      setUploadSuccess(true);
      // 成功後、2秒後にモーダルを閉じてページをリロード
      setTimeout(() => {
        setUploadModalOpen(false);
        window.location.reload();
      }, 2000);
    } else {
      setUploadError(result.error || "アップロードに失敗しました。");
    }
  };

  const handleModalClose = () => {
    setUploadModalOpen(false);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleReplayOnboarding = () => {
    handleClose();

    window.setTimeout(() => {
      localStorage.removeItem(CHOROPLETH_ONBOARDING_KEY);
      window.dispatchEvent(new Event(RESTART_CHOROPLETH_ONBOARDING_EVENT));
    }, 0);
  };

  return (
    <Drawer open={isOpen} onClose={handleClose} className="w-[300px]">
      <Drawer.Header title="設定" titleIcon={HiOutlineCog} />
      <Drawer.Items>
        <fieldset className="rounded-lg border border-solid border-gray-300 p-3">
          <legend className="text-sm text-gray-500 dark:text-gray-400">
            保存と復元
          </legend>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            主題図や商圏をダウンロード・アップロードして保存・復元できます。
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              className="inline-flex items-center"
              onClick={downloadStorageAsJson}
            >
              ダウンロード
              <HiOutlineDownload className="ml-2 size-5" />
            </Button>
            <Button
              className="inline-flex items-center"
              onClick={() => setUploadModalOpen(true)}
            >
              アップロード
              <HiOutlineUpload className="ml-2 size-5" />
            </Button>
          </div>
        </fieldset>

        <Modal show={uploadModalOpen} onClose={handleModalClose}>
          <Modal.Header>データのアップロード</Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ダウンロードした47maps-yyyymmdd.jsonファイルを選択してください。
                <br />
                現在のデータは上書きされます。
              </p>

              {uploadError && (
                <Alert color="failure" onDismiss={() => setUploadError(null)}>
                  <span className="font-medium">エラー:</span> {uploadError}
                </Alert>
              )}

              {uploadSuccess && (
                <Alert color="success">
                  <span className="font-medium">成功:</span>{" "}
                  データをインポートしました。ページをリロードします...
                </Alert>
              )}

              <div>
                <Label htmlFor="file-upload" value="JSONファイルを選択" />
                <FileInput
                  id="file-upload"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  disabled={isUploading || uploadSuccess}
                  helperText="47mapsでエクスポートしたJSONファイルのみ対応しています"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={handleModalClose}
              disabled={isUploading || uploadSuccess}
            >
              {uploadSuccess ? "閉じる" : "キャンセル"}
            </Button>
          </Modal.Footer>
        </Modal>

        <fieldset className="mt-6 rounded-lg border border-solid border-gray-300 p-3">
          <legend className="text-sm text-gray-500 dark:text-gray-400">
            表示
          </legend>
          <div className="flex items-center gap-2">
            <Checkbox
              id="restore-on-startup"
              defaultChecked={isRestoreOnStartupEnabled()}
              onChange={(event) =>
                setRestoreOnStartupEnabled(event.target.checked)
              }
            />
            <Label
              htmlFor="restore-on-startup"
              className="flex text-gray-500 dark:text-gray-400"
            >
              起動時に前回のマップを復元します
            </Label>
          </div>
        </fieldset>

        <fieldset className="mt-6 rounded-lg border border-solid border-gray-300 p-3">
          <legend className="text-sm text-gray-500 dark:text-gray-400">
            ライト／ダークモード
          </legend>
          <DarkThemeToggle />
        </fieldset>

        <fieldset className="mt-6 rounded-lg border border-solid border-gray-300 p-3">
          <legend className="text-sm text-gray-500 dark:text-gray-400">
            関連情報
          </legend>
          <button
            type="button"
            onClick={handleReplayOnboarding}
            className="block text-sm text-gray-500 hover:underline dark:text-gray-400"
          >
            <FaRegPlayCircle className="mr-2 inline-block" />
            初回案内をもう一度見る
          </button>
          <a
            href={helpUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm text-gray-500 hover:underline dark:text-gray-400"
          >
            <FaRegQuestionCircle className="mr-2 inline-block" />
            ヘルプ
          </a>
          <a
            href="https://github.com/47stats/47maps-react"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm text-gray-500 hover:underline dark:text-gray-400"
          >
            <FaGithub className="mr-2 inline-block" />
            GitHub
          </a>
        </fieldset>
      </Drawer.Items>
    </Drawer>
  );
};
