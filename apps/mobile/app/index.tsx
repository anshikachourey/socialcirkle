import React from "react";
import { View, StyleSheet } from "react-native";
import { Link, router } from "expo-router";           // ⬅️ import router
import { Button, Text } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";

export default function Index() {
  const { signOut } = useAuth();

  const onSignOut = async () => {
    await signOut();                  // uses RN Firebase under the hood
    router.replace("/auth");          // if your auth screen is /login, use "/login" instead
  };

  return (
    <View style={styles.view}>
      <Text variant="headlineSmall" style={{ marginBottom: 12 }}>
        SocialCirkle
      </Text>
      <Link href="/auth" style={styles.link}>Go to Auth</Link>
      <Button mode="text" icon="logout" onPress={onSignOut}>
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  view: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  link: { textAlign: "center" },
});
