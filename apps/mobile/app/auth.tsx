// app/auth.tsx
import React, { useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet, Pressable } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { auth, db, firestore, signInEmail, signUpEmail, onAuthChanged } from "@/lib/firebase";
import { router } from "expo-router";

export default function AuthScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthChanged((u) => {
      if (u) router.replace("/home");
    });
    return unsub;
  }, []);

  const handleAuth = async () => {
    const e = email.trim();
    setError(null);
    if (!e || !password) return setError("Please fill in all the fields!");
    if (password.length < 6) return setError("The password should have at least 6 characters.");

    try {
      setSubmitting(true);
      if (isSignUp) {
        await signUpEmail(e, password);
      } else {
        await signInEmail(e, password);
      }

      router.replace("/home");

      const uid = auth.currentUser?.uid;
      if (uid) {
        db.collection("users").doc(uid).set(
          {
            email: auth.currentUser?.email ?? e,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        ).catch((err: any) => console.warn("user upsert failed:", err?.message ?? err));
      }
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchMode = () => setIsSignUp((prev) => !prev);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>SocialCirkle</Text>

        <Pressable onPress={handleSwitchMode}>
          <Text style={styles.loginText}>
            {isSignUp ? "Sign Up" : "Login"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} variant="headlineMedium">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>

        <TextInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          label="Password"
          mode="outlined"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {!!error && <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{error}</Text>}

        <Button
          mode="contained"
          style={styles.button}
          onPress={handleAuth}
          loading={submitting}
          disabled={submitting}
          buttonColor="#111827"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button mode="text" onPress={handleSwitchMode} style={styles.switchModeButton}>
          {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  brand: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  loginText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  content: { flex: 1, padding: 20, justifyContent: "center" },
  title: { textAlign: "center", marginBottom: 24, fontWeight: "600" },
  input: { marginBottom: 16 },
  button: { marginBottom: 24, borderRadius: 10 },
  switchModeButton: { alignSelf: "center" },
});


// import React, { useState } from "react";
// import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
// import { Text, TextInput, Button, useTheme } from 'react-native-paper' ;
// export default function AuthScreen(){
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isSignUp, setIsSignUp] = useState<boolean>(false);
//     const [error, setError] = useState<string | null>("")
//     const handleAuth = async () => {
//         if(!email || !password){
//             setError("Please fill in all the fields!");
//             return;
//         }
//         if(password.length < 6){
//             setError("The password should have atleast 6 characters.");
//             return;
        
//         }
//         setError(null);

//     };


//     const theme = useTheme();
    
//     const handleSwitchMode = async () =>{
//         setIsSignUp((prev)=> !prev);
//     };
//     return (
//     <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "padding" : "height"} style={styles.container}>
//         <View style ={styles.content}>
//             <Text style={styles.title} variant="headlineMedium">{ isSignUp? "Create Account" : "Welcome Back"}</Text>
//             <TextInput label="Email" autoCapitalize="none" keyboardType="email-address" 
//             placeholder="example@gmail.com" mode="outlined" style={styles.input} onChangeText={setEmail} />
//             <TextInput label="Password" autoCapitalize="none" keyboardType="email-address" 
//             mode="outlined" style={styles.input} onChangeText={setPassword} />
//             {error && (
//                 <Text style={{color: theme.colors.error}}>{error}</Text>
//             )}
//             <Button mode="contained" style={styles.button} onPress={handleAuth}> {isSignUp? "Sign Up": "Sign In"  } </Button>
//             <Button mode="text" onPress={handleSwitchMode} style={styles.switchModeButton}> {isSignUp? "Already have an account? Log in": "Don't have an account? Sign Up"}</Button>
//         </View>
//     </KeyboardAvoidingView>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: "white",
//     },
//     content:{
//         flex: 1,
//         padding: 15,
//         justifyContent: "center",
//     },
//     title:{
//         textAlign: "center",
//         marginBottom: 24,
//     },
//     input:{
//         marginBottom: 16,
//     },
//     button:{
//         textAlign: "center",
//         marginBottom: 24,
//     },
//     switchModeButton:{

//     },
// });