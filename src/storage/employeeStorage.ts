import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY='jmk_mobile_employees';

export async function getEmployees(){
  const v=await AsyncStorage.getItem(KEY);
  return v?JSON.parse(v):[];
}

export async function saveEmployees(data:any[]){
  await AsyncStorage.setItem(KEY,JSON.stringify(data));
}
