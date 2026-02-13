# Android WebView App Guide for Corn Leaf Disease Detector

This guide will walk you through creating an Android app that hosts your React web application using WebView.

## Prerequisites

1. Android Studio (latest stable version)
2. JDK 17 or later
3. Your React application built for production

## Step 1: Create a New Android Project

1. Open Android Studio
2. Select "New Project"
3. Choose "Empty Activity" and click "Next"
4. Configure your project:
   - Name: `CornLeafDiseaseDetector`
   - Package name: `com.example.cornleafdiseasedetector` (or your preferred package name)
   - Language: Kotlin (recommended) or Java
   - Minimum SDK: API 21 (Android 5.0) or higher
5. Click "Finish" and wait for the project to be created

## Step 2: Add Internet Permission

1. Open `AndroidManifest.xml`
2. Add the following permission before the `<application>` tag:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   ```

## Step 3: Configure WebView in Layout

1. Open `activity_main.xml`
2. Replace its content with:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <androidx.constraintlayout.widget.ConstraintLayout 
       xmlns:android="http://schemas.android.com/apk/res/android"
       xmlns:app="http://schemas.android.com/apk/res-auto"
       android:layout_width="match_parent"
       android:layout_height="match_parent">

       <WebView
           android:id="@+id/webview"
           android:layout_width="match_parent"
           android:layout_height="match_parent"
           app:layout_constraintBottom_toBottomOf="parent"
           app:layout_constraintEnd_toEndOf="parent"
           app:layout_constraintStart_toStartOf="parent"
           app:layout_constraintTop_toTopOf="parent" />

   </androidx.constraintlayout.widget.ConstraintLayout>
   ```

## Step 4: Add Required Permissions

1. Open `AndroidManifest.xml`
2. Add these permissions before the `<application>` tag:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
       android:maxSdkVersion="32" />
   <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
       android:maxSdkVersion="28" />
   
   <!-- Required for camera -->
   <uses-feature android:name="android.hardware.camera" android:required="false" />
   <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
   ```

## Step 5: Create File Chooser Helper

1. Create a new Kotlin file named `FileChooserHelper.kt`:
   ```kotlin
   package com.example.cornleafdiseasedetector

   import android.app.Activity
   import android.content.ClipData
   import android.content.Intent
   import android.net.Uri
   import android.os.Environment
   import android.provider.MediaStore
   import android.webkit.ValueCallback
   import android.webkit.WebChromeClient
   import androidx.core.content.FileProvider
   import java.io.File
   import java.io.IOException
   import java.text.SimpleDateFormat
   import java.util.*

   class FileChooserHelper(private val activity: Activity) {
       private var filePathCallback: ValueCallback<Array<Uri>>? = null
       private var cameraImageUri: Uri? = null

       fun getFilePathCallback(): ValueCallback<Array<Uri>>? = filePathCallback

       fun setFilePathCallback(filePathCallback: ValueCallback<Array<Uri>>?) {
           this.filePathCallback = filePathCallback
       }

       fun getCameraImageUri(): Uri? = cameraImageUri

       fun createImageFile(): File? {
           val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
           val storageDir = activity.getExternalFilesDir(Environment.DIRECTORY_PICTURES)
           return File.createTempFile("JPEG_${timeStamp}_", ".jpg", storageDir)
       }

       fun getCameraIntent(): Intent? {
           return try {
               val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
               val photoFile = createImageFile()
               
               photoFile?.let {
                   val photoURI = FileProvider.getUriForFile(
                       activity,
                       "${activity.packageName}.fileprovider",
                       it
                   )
                   cameraImageUri = photoURI
                   takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI)
                   takePictureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                   takePictureIntent
               }
           } catch (ex: IOException) {
               null
           }
       }

       fun getGalleryIntent(): Intent {
           val intent = Intent(Intent.ACTION_GET_CONTENT)
           intent.addCategory(Intent.CATEGORY_OPENABLE)
           intent.type = "image/*"
           return Intent.createChooser(intent, "Select Image")
       }

       fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
           if (filePathCallback == null) return false
           
           var results: Array<Uri>? = null
           
           if (resultCode == Activity.RESULT_OK) {
               when (requestCode) {
                   REQUEST_CAMERA -> {
                       cameraImageUri?.let { uri ->
                           results = arrayOf(uri)
                       }
                   }
                   REQUEST_GALLERY -> {
                       data?.data?.let { uri ->
                           results = arrayOf(uri)
                       } ?: run {
                           data?.clipData?.let { clipData ->
                               val uris = ArrayList<Uri>(clipData.itemCount)
                               for (i in 0 until clipData.itemCount) {
                                   uris.add(clipData.getItemAt(i).uri)
                               }
                               results = uris.toTypedArray()
                           }
                       }
                   }
               }
           }
           
           filePathCallback?.onReceiveValue(results)
           filePathCallback = null
           return results != null
       }

       companion object {
           const val REQUEST_CAMERA = 1001
           const val REQUEST_GALLERY = 1002
       }
   }
   ```

## Step 6: Configure WebView in MainActivity

1. Open `MainActivity.kt` (or `.java` if using Java)
2. Replace its content with:

   ```kotlin
   package com.example.cornleafdiseasedetector

   import android.annotation.SuppressLint
   import android.os.Bundle
   import android.webkit.WebView
   import android.webkit.WebViewClient
   import android.webkit.WebSettings
   import androidx.appcompat.app.AppCompatActivity

   class MainActivity : AppCompatActivity() {
       private lateinit var webView: WebView
       private lateinit var fileChooserHelper: FileChooserHelper
       private var filePathCallback: ValueCallback<Array<Uri>>? = null

       @SuppressLint("SetJavaScriptEnabled")
       override fun onCreate(savedInstanceState: Bundle?) {
           super.onCreate(savedInstanceState)
           setContentView(R.layout.activity_main)
           
           fileChooserHelper = FileChooserHelper(this)

           webView = findViewById(R.id.webview)
           
           // Enable JavaScript
           val webSettings: WebSettings = webView.settings
           webSettings.javaScriptEnabled = true
           webSettings.domStorageEnabled = true
           webSettings.loadWithOverviewMode = true
           webSettings.useWideViewPort = true
           
           // Enable zoom controls
           webSettings.setSupportZoom(true)
           webSettings.builtInZoomControls = true
           webSettings.displayZoomControls = false
           
           // Enable local storage
           webSettings.databaseEnabled = true
           
           // Configure WebChromeClient for file uploads
           webView.webChromeClient = object : WebChromeClient() {
               // For Android 5.0+
               override fun onShowFileChooser(
                   webView: WebView,
                   filePathCallback: ValueCallback<Array<Uri>>,
                   fileChooserParams: FileChooserParams
               ): Boolean {
                   this@MainActivity.filePathCallback?.onReceiveValue(null)
                   this@MainActivity.filePathCallback = filePathCallback
                   
                   val takePictureIntent = fileChooserHelper.getCameraIntent()
                   val contentSelectionIntent = fileChooserHelper.getGalleryIntent()
                   
                   val intentArray: Array<Intent> = takePictureIntent?.let { arrayOf(it) } ?: arrayOf()
                   val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                       putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
                       putExtra(Intent.EXTRA_TITLE, "Select Image")
                       if (intentArray.isNotEmpty()) {
                           putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray)
                       }
                   }
                   
                   startActivityForResult(chooserIntent, FileChooserHelper.REQUEST_GALLERY)
                   return true
               }
           }
           
           // Handle page navigation within the WebView
           webView.webViewClient = object : WebViewClient() {
               override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                   view.loadUrl(url)
                   return true
               }
           }
           
           // Load your hosted URL or local file
           // For local files, use: file:///android_asset/your_build_folder/index.html
           webView.loadUrl("https://your-deployed-url.com") // Replace with your actual URL
       }

       // Handle back button press
       override fun onBackPressed() {
           if (webView.canGoBack()) {
               webView.goBack()
           } else {
               super.onBackPressed()
           }
       }
   }
   ```

## Step 5: (Optional) For Local Development

If you want to test with a local build:

1. Build your React app:
   ```bash
   npm run build
   ```

2. Copy the contents of the `build` folder to `app/src/main/assets/` in your Android project
   - Create the `assets` folder if it doesn't exist
   - Copy all files from `build/` to `app/src/main/assets/`

3. Modify the WebView URL in `MainActivity.kt`:
   ```kotlin
   webView.loadUrl("file:///android_asset/index.html")
   ```

## Step 6: Enable JavaScript Interface (if needed)

If your web app needs to communicate with native Android code:

```kotlin
// In MainActivity.kt
class WebAppInterface(private val mContext: Context) {
    @JavascriptInterface
    fun showToast(toast: String) {
        Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show()
    }
}

// In onCreate() after WebView initialization
webView.addJavascriptInterface(WebAppInterface(this), "Android")
```

Now you can call Android methods from your web app:
```javascript
if (window.Android) {
    Android.showToast("Hello from WebView!");
}
```

## Step 7: Build and Run

1. Connect an Android device or start an emulator
2. Click "Run" in Android Studio
3. Select your device and click "OK"

## Step 8: (Optional) Customize App Icon

1. Right-click on `res` folder → New → Image Asset
2. Choose your icon and configure as needed
3. Click "Next" and then "Finish"

## Step 9: Configure File Provider

1. Create a new XML file at `res/xml/file_paths.xml`:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <paths>
       <external-files-path name="my_images" path="Pictures" />
       <cache-path name="my_cache" path="." />
   </paths>
   ```

2. Add the FileProvider to your `AndroidManifest.xml` inside the `<application>` tag:
   ```xml
   <provider
       android:name="androidx.core.content.FileProvider"
       android:authorities="${applicationId}.fileprovider"
       android:exported="false"
       android:grantUriPermissions="true">
       <meta-data
           android:name="android.support.FILE_PROVIDER_PATHS"
           android:resource="@xml/file_paths" />
   </provider>
   ```

## Step 10: Update Web App for File Upload

In your React web app, use a file input to trigger the native file picker:

```jsx
function ImageUpload() {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle the selected file
      const reader = new FileReader();
      reader.onload = (e) => {
        // Use the file data
        console.log('File content:', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" // Use back camera if available
        onChange={handleFileChange}
      />
      <button onClick={() => document.querySelector('input[type="file"]').click()}>
        Select Image
      </button>
    </div>
  );
}
```

## Step 11: Generate Signed Bundle/APK

1. Click "Build" → "Generate Signed Bundle / APK"
2. Create a new keystore or use existing
3. Fill in the required details
4. Choose release build type
5. Click "Finish"

## Troubleshooting

1. **WebView not loading content**:
   - Check internet permission in AndroidManifest.xml
   - Ensure the URL is correct and accessible
   - Check Logcat for errors

2. **JavaScript not working**:
   - Make sure JavaScript is enabled in WebSettings
   - Check for console errors in Logcat

3. **Mixed content issues**:
   - If loading HTTP content on HTTPS, add:
     ```xml
     android:usesCleartextTraffic="true"
     ```
     to the `<application>` tag in AndroidManifest.xml

## Next Steps

1. Add splash screen
2. Implement offline support with Service Worker
3. Add push notifications
4. Customize WebView UI (progress bar, error handling)
5. Implement deep linking

## Important Notes

1. Test on multiple Android versions
2. Consider using Chrome Custom Tabs for external links
3. Handle orientation changes if needed
4. Implement proper error handling and offline states
5. Consider using WebViewFragment for better lifecycle management in complex apps
