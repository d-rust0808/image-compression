import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Image,
  Alert,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Image as CompressorImage } from "react-native-compressor";
import { StatusBar } from "expo-status-bar";

const App = () => {
  const [imageUri, setImageUri] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState("medium"); 
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imageDetails, setImageDetails] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần cấp quyền",
          "Ứng dụng cần quyền truy cập thư viện ảnh để hoạt động"
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, 
        quality: 1, 
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log("Ảnh gốc:", uri);

        // Lấy thông tin ảnh gốc
        const fileInfo = await FileSystem.getInfoAsync(uri);
        setOriginalSize(fileInfo.size);

        // Lưu thông tin chi tiết về ảnh
        setImageDetails({
          width: result.assets[0].width,
          height: result.assets[0].height,
          type: result.assets[0].type || "image/*",
          fileName: result.assets[0].fileName || "unknown",
        });
        await compressImage(uri);
      } else {
        console.log("Người dùng hủy chọn ảnh");
      }
      setIsLoading(false);
    } catch (error) {
      console.log("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh: " + error.message);
      setIsLoading(false);
    }
  };
  const compressImage = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      let quality;
      switch (compressionLevel) {
        case "low":
          quality = 0.9; // Nén nhẹ
          break;
        case "medium":
          quality = 0.7; // Nén trung bình
          break;
        case "high":
          quality = 0.5; // Nén mạnh
          break;
        default:
          quality = 0.7;
      }
      const minSize = 50 * 1024; // 50KB
      if (fileInfo.size < minSize) {
        console.log("Ảnh đã nhỏ, không cần nén");
        setCompressedSize(fileInfo.size);
        setImageUri(uri);
        return uri;
      }

      // Nén ảnh với chất lượng phù hợp
      const compressedUri = await CompressorImage.compress(uri, {
        compressionMethod: "auto",
        quality: quality,
        output: "jpg",
      });

      // Kiểm tra kết quả
      const compressedInfo = await FileSystem.getInfoAsync(compressedUri);

      // Nếu kích thước sau nén lớn hơn, giữ nguyên ảnh gốc
      if (compressedInfo.size > fileInfo.size) {
        console.log("Nén không hiệu quả, giữ nguyên ảnh gốc");
        setCompressedSize(fileInfo.size);
        setImageUri(uri);
        return uri;
      }

      setCompressedSize(compressedInfo.size);
      setImageUri(compressedUri);
      return compressedUri;
    } catch (error) {
      console.log("Lỗi nén ảnh:", error);
      Alert.alert("Lỗi", "Không thể nén ảnh: " + error.message);
      return uri;
    }
  };

  // Hàm giả lập tải lên server
  const uploadToServer = async () => {
    if (!imageUri) {
      Alert.alert("Thông báo", "Vui lòng chọn ảnh trước khi tải lên");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Giả lập quá trình tải lên với tốc độ ngẫu nhiên
      for (let i = 0; i <= 10; i++) {
        const randomDelay = Math.floor(Math.random() * 300) + 200; // 200-500ms
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
        setUploadProgress(i * 10);
      }

      // Hoàn thành
      Alert.alert("Thành công", "Đã tải ảnh lên server thành công!");
      setUploadProgress(0);
      setIsUploading(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải ảnh lên server: " + error.message);
      setIsUploading(false);
    }
  };

  // Thay đổi mức độ nén và áp dụng lại nếu đã có ảnh
  const changeCompressionLevel = async (level) => {
    setCompressionLevel(level);
    if (imageUri && originalSize) {
      setIsLoading(true);
      // Lấy lại URI gốc từ imageDetails nếu có thể
      const originalUri = imageDetails ? imageUri : imageUri;
      await compressImage(originalUri);
      setIsLoading(false);
    }
  };


  const calculateReduction = () => {
    if (!originalSize || !compressedSize) return 0;
    const reduction = ((originalSize - compressedSize) / originalSize) * 100;
    return reduction.toFixed(2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Nén ảnh không cắt khung</Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={pickImage}
            disabled={isLoading || isUploading}
          >
            <Text style={styles.buttonText}>Chọn ảnh</Text>
          </TouchableOpacity>

          {imageUri && (
            <TouchableOpacity
              style={[styles.button, styles.uploadButton]}
              onPress={uploadToServer}
              disabled={isLoading || isUploading}
            >
              <Text style={styles.buttonText}>Tải lên server</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.compressionOptions}>
          <Text style={styles.subtitle}>Mức độ nén:</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                compressionLevel === "low" && styles.optionActive,
              ]}
              onPress={() => changeCompressionLevel("low")}
              disabled={isLoading || isUploading}
            >
              <Text
                style={[
                  styles.optionText,
                  compressionLevel === "low" && styles.optionTextActive,
                ]}
              >
                Thấp
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                compressionLevel === "medium" && styles.optionActive,
              ]}
              onPress={() => changeCompressionLevel("medium")}
              disabled={isLoading || isUploading}
            >
              <Text
                style={[
                  styles.optionText,
                  compressionLevel === "medium" && styles.optionTextActive,
                ]}
              >
                Trung bình
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                compressionLevel === "high" && styles.optionActive,
              ]}
              onPress={() => changeCompressionLevel("high")}
              disabled={isLoading || isUploading}
            >
              <Text
                style={[
                  styles.optionText,
                  compressionLevel === "high" && styles.optionTextActive,
                ]}
              >
                Cao
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Đang xử lý ảnh...</Text>
          </View>
        )}
        {isUploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBar, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}
        {imageUri && !isLoading && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Thông tin ảnh:</Text>
              <Text style={styles.infoText}>
                Dung lượng gốc: {(originalSize / 1024).toFixed(2)} KB
              </Text>
              <Text style={styles.infoText}>
                Dung lượng sau nén: {(compressedSize / 1024).toFixed(2)} KB
              </Text>
              <Text style={styles.infoText}>Giảm: {calculateReduction()}%</Text>
              {imageDetails && (
                <>
                  <Text style={styles.infoText}>
                    Kích thước: {imageDetails.width} x {imageDetails.height} px
                  </Text>
                  {imageDetails.fileName && (
                    <Text style={styles.infoText}>
                      Tên file: {imageDetails.fileName}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#555",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0066cc",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  uploadButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  imageContainer: {
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoContainer: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#444",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  compressionOptions: {
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: "#ddd",
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  optionActive: {
    backgroundColor: "#0066cc",
  },
  optionText: {
    fontWeight: "500",
    color: "#444",
  },
  optionTextActive: {
    color: "white",
  },
  progressContainer: {
    marginVertical: 15,
    alignItems: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#28a745",
  },
  progressText: {
    marginTop: 5,
    color: "#555",
  },
});

export default App;
