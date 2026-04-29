import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// 1. สร้าง หน้า Screen ต่างๆ
// ==========================================

// --- หน้า Login ---
function LoginScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.container, styles.centerContent, {backgroundColor: '#fdf6e3'}]}>
      <Ionicons name="log-in-outline" size={80} color="black" style={{marginBottom: 30}} />
      <TextInput style={styles.input} placeholder="Email" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry />
      <TouchableOpacity style={styles.fullWidthButton} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.fullWidthButtonText}>LOGIN</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fullWidthButton} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.fullWidthButtonText}>REGISTER</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fullWidthButton} onPress={() => navigation.navigate('Forgot')}>
        <Text style={styles.fullWidthButtonText}>FORGOT PASSWORD</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- หน้า Register ---
function RegisterScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.container, styles.centerContent, {backgroundColor: '#fdf6e3'}]}>
      <Ionicons name="person-add-outline" size={80} color="black" style={{marginBottom: 30}} />
      <TextInput style={styles.input} placeholder="Email" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry />
      <TextInput style={styles.input} placeholder="Name" />
      <TouchableOpacity style={styles.fullWidthButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.fullWidthButtonText}>REGISTER</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fullWidthButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.fullWidthButtonText}>BACK</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- หน้า Forgot Password ---
function ForgotScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.container, styles.centerContent, {backgroundColor: '#fdf6e3'}]}>
      <Ionicons name="mail-outline" size={80} color="black" style={{marginBottom: 30}} />
      <TextInput style={styles.input} placeholder="Email" />
      <TouchableOpacity style={styles.fullWidthButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.fullWidthButtonText}>RESET PASSWORD</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fullWidthButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.fullWidthButtonText}>BACK</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- หน้า Home (ย้ายโค้ดจาก Lab 5 มาใส่ที่นี่) ---
const ProductCard = ({ name, price, stock, pic, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.card}>
      <Image source={{ uri: pic }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.productName} numberOfLines={2}>{name}</Text>
        <Text style={styles.productStock}>จำนวนคงเหลือ {stock}</Text>
        <Text style={styles.productPrice}>${price}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterType, setFilterType] = useState('ALL');

  const fetchProducts = async () => {
    let allData = [];
    let pageId = 1;
    let hasMoreData = true;
    try {
      while (hasMoreData) {
        const response = await fetch(`http://10.1.209.231:3000/api/products?pageno=${pageId}`);
        const textData = await response.text();
        if (textData.trim() === "" || textData.includes("null")) {
            hasMoreData = false;
        } else {
            const jsonResponse = JSON.parse(textData);
            const productsArray = jsonResponse.data;
            if(productsArray && productsArray.length > 0) {
               allData = [...allData, ...productsArray]; 
               if (pageId >= jsonResponse.totalPages) hasMoreData = false;
               else pageId++; 
            } else hasMoreData = false;
        }
        if (pageId > 20) hasMoreData = false; 
      }
      setProducts(allData);
      setFilteredProducts(allData); 
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFilter = (type) => {
    setFilterType(type); 
    if (type === 'ALL') {
      setFilteredProducts([...products]);
    } else if (type === 'IN_STOCK') {
      const inStockOnly = products.filter(item => {
        const stockValue = parseInt(item?.stock || 0); 
        return !isNaN(stockValue) && stockValue > 0;
      });
      setFilteredProducts(inStockOnly);
    }
  };

  const handleSelectProduct = async (productName) => {
    Alert.alert("Alert", `บันทึกแล้ว ${productName}`);
    try {
      const savedCart = await AsyncStorage.getItem('myCart');
      let currentCart = savedCart ? JSON.parse(savedCart) : [];
      currentCart.push(productName);
      await AsyncStorage.setItem('myCart', JSON.stringify(currentCart));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.button} onPress={() => handleFilter('ALL')}>
          <Text style={[styles.buttonText, filterType === 'ALL' && styles.activeButtonText]}>ALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleFilter('IN_STOCK')}>
          <Text style={[styles.buttonText, filterType === 'IN_STOCK' && styles.activeButtonText]}>IN STOCK</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollArea}>
        {filteredProducts.map((item, index) => (
          <ProductCard key={item.id + "_" + index} name={item.name} price={item.price} stock={item.stock} pic={item.pic} onPress={() => handleSelectProduct(item.name)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- หน้า Cart ---
function CartScreen() {
  const [cartItems, setCartItems] = useState([]);

  // ดึงข้อมูลใหม่ทุกครั้งที่กดเข้ามาหน้านี้ (ดัก Focus)
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem('myCart');
        if (savedCart !== null) setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    };
    loadCart();
    
    // ตั้งเวลาโหลดซ้ำเบาๆ ให้ข้อมูลอัปเดต (วิธีลูกทุ่งแบบง่ายๆ)
    const interval = setInterval(loadCart, 2000); 
    return () => clearInterval(interval);
  }, []);

  const handleClearCart = async () => {
    try {
      await AsyncStorage.removeItem('myCart');
      setCartItems([]);
      Alert.alert("Alert", "ตะกร้าสินค้าถูกลบแล้ว");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: '#fdf6e3'}]}>
      <ScrollView style={styles.cartScrollArea}>
        {cartItems.map((item, index) => (
          <Text key={index} style={styles.cartItemText}>{item}</Text>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
        <Text style={styles.clearButtonText}>CLEAR CART</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- หน้า Profile ---
function ProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.container, styles.centerContent, {backgroundColor: '#fdf6e3'}]}>
      <Ionicons name="person-circle-outline" size={120} color="black" />
      <Text style={{fontSize: 20, marginBottom: 30, fontWeight: 'bold'}}>Your Name</Text>
      <TouchableOpacity style={styles.fullWidthButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.fullWidthButtonText}>LOGOUT</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ==========================================
// 2. ตั้งค่าระบบนำทาง (Navigation)
// ==========================================
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- แถบเมนูด้านล่าง (Tab Navigator) ---
function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Cart') iconName = focused ? 'cart' : 'cart-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6200ee',
      tabBarInactiveTintColor: 'gray',
    })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{headerShown: false}} />
      <Tab.Screen name="Cart" component={CartScreen} options={{headerShown: false}} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{headerShown: false}} />
    </Tab.Navigator>
  );
}

// --- โครงสร้างหลัก (Stack Navigator) ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Forgot" component={ForgotScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==========================================
// 3. Stylesheet (รวมสไตล์เก่า+ใหม่)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centerContent: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  input: { width: '100%', backgroundColor: '#cce5ff', padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#000' },
  fullWidthButton: { width: '100%', backgroundColor: '#d1c4e9', padding: 15, alignItems: 'center', marginBottom: 10 },
  fullWidthButtonText: { color: '#fff', fontWeight: 'bold' },
  filterContainer: { backgroundColor: '#d1c4e9', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingTop: 40 },
  button: { paddingVertical: 8, paddingHorizontal: 20 },
  buttonText: { color: '#888', fontWeight: 'bold', fontSize: 16 },
  activeButtonText: { color: '#fff' },
  scrollArea: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  card: { backgroundColor: '#ffffff', marginBottom: 25, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  image: { width: '100%', height: 180, resizeMode: 'contain' },
  textContainer: { marginTop: 15 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#000', lineHeight: 22 },
  productStock: { fontSize: 14, color: '#888', fontStyle: 'italic', marginTop: 4 },
  productPrice: { fontSize: 16, color: '#e74c3c', fontWeight: 'bold', marginTop: 4 },
  cartScrollArea: { padding: 20, paddingTop: 40 },
  cartItemText: { fontSize: 16, color: '#333', marginBottom: 15, fontWeight: '500' },
  clearButton: { backgroundColor: '#d1c4e9', paddingVertical: 15, alignItems: 'center' },
  clearButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});