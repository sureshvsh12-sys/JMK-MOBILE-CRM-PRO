import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

export default function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const gallery = useMemo(() => [...new Set(images.filter(Boolean))], [images]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => setIndex(0), [gallery]);

  if (!gallery.length) return <View style={styles.empty}><Text style={styles.emptyIcon}>▧</Text><Text style={styles.emptyText}>No property image</Text></View>;
  const move = (step: number) => setIndex((current) => (current + step + gallery.length) % gallery.length);

  return <>
    <View style={styles.container}>
      <Pressable onPress={() => setOpen(true)}><Image source={{ uri: gallery[index] }} style={styles.main} resizeMode="cover" /></Pressable>
      <View style={styles.counter}><Text style={styles.counterText}>{index + 1}/{gallery.length}</Text></View>
      {gallery.length > 1 && <><Pressable style={[styles.arrow, styles.left]} onPress={() => move(-1)}><Text style={styles.arrowText}>‹</Text></Pressable><Pressable style={[styles.arrow, styles.right]} onPress={() => move(1)}><Text style={styles.arrowText}>›</Text></Pressable></>}
    </View>
    {gallery.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>{gallery.map((image, itemIndex) => <Pressable key={`${image}-${itemIndex}`} onPress={() => setIndex(itemIndex)} style={[styles.thumbWrap, itemIndex === index && styles.thumbActive]}><Image source={{ uri: image }} style={styles.thumb} /></Pressable>)}</ScrollView>}
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={styles.modal}><Pressable style={styles.close} onPress={() => setOpen(false)}><Text style={styles.closeText}>×</Text></Pressable><Image source={{ uri: gallery[index] }} style={styles.full} resizeMode="contain" accessibilityLabel={`${title} image ${index + 1}`} />{gallery.length > 1 && <><Pressable style={[styles.arrow, styles.modalLeft]} onPress={() => move(-1)}><Text style={styles.arrowText}>‹</Text></Pressable><Pressable style={[styles.arrow, styles.modalRight]} onPress={() => move(1)}><Text style={styles.arrowText}>›</Text></Pressable></>}<Text style={styles.modalCounter}>{index + 1} / {gallery.length}</Text></View></Modal>
  </>;
}

const styles = StyleSheet.create({container:{position:"relative",overflow:"hidden",borderRadius:RADIUS.xl,backgroundColor:COLORS.surfaceLight},main:{width:"100%",height:260},empty:{height:230,alignItems:"center",justifyContent:"center",borderRadius:RADIUS.xl,backgroundColor:COLORS.surfaceLight},emptyIcon:{fontSize:48,color:COLORS.textMuted},emptyText:{marginTop:8,color:COLORS.textMuted,fontWeight:"800"},counter:{position:"absolute",left:12,bottom:12,borderRadius:RADIUS.round,backgroundColor:"rgba(7,26,45,0.82)",paddingHorizontal:12,paddingVertical:6},counterText:{color:"white",fontWeight:"900"},arrow:{position:"absolute",width:42,height:42,alignItems:"center",justifyContent:"center",borderRadius:RADIUS.round,backgroundColor:"rgba(7,26,45,0.82)"},left:{left:10,top:109},right:{right:10,top:109},arrowText:{marginTop:-4,color:"white",fontSize:36,lineHeight:38},thumbs:{gap:8,paddingTop:10,paddingBottom:2},thumbWrap:{padding:2,borderWidth:2,borderColor:"transparent",borderRadius:RADIUS.md},thumbActive:{borderColor:COLORS.assets},thumb:{width:82,height:62,borderRadius:RADIUS.sm},modal:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(0,0,0,0.96)"},full:{width:"92%",height:"82%"},close:{position:"absolute",zIndex:2,right:18,top:50,width:44,height:44,alignItems:"center",justifyContent:"center",borderRadius:RADIUS.round,backgroundColor:"rgba(255,255,255,0.14)"},closeText:{color:"white",fontSize:32,lineHeight:34},modalLeft:{left:14,top:"48%"},modalRight:{right:14,top:"48%"},modalCounter:{position:"absolute",bottom:42,color:"white",fontWeight:"900"}});
