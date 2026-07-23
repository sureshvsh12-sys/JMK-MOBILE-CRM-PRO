import {SafeAreaView} from 'react-native-safe-area-context';
import {View,Text} from 'react-native';

export default function EmployeeListScreen(){
  return(
    <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <View>
        <Text style={{fontSize:24,fontWeight:'700'}}>Employees Module</Text>
        <Text>JMK CRM PRO Enterprise</Text>
      </View>
    </SafeAreaView>
  );
}
