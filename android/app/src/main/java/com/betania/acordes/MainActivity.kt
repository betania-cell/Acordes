package com.betania.acordes

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONArray
import org.json.JSONObject

private const val STORAGE_KEY = "harmona:songs:v1"
private val noteOrder = listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")

private data class Song(val id: String, val name: String, val content: String)

private val defaultSong = Song(
    id = "default",
    name = "Acordes demo",
    content = """Tom: G

G           D/F#
Hoje o céu abriu de vez
Em      C
E o vento entrou no meu peito

G            D
Quero tocar teu nome
C             D
Sem medo, sem mapa, sem fim

G                 D
E quando a noite cair
Em            C
Eu vou seguir, meu coração

G      D      Em      C
Se a música me levar
G      D      Em      C
Eu vou te encontrar"""
)

private fun transposeChord(chord: String, amount: Int): String {
    val rootMatch = Regex("^([A-G](?:#|b)?)").find(chord) ?: return chord
    val root = rootMatch.value
    val rest = chord.removePrefix(root)
    var index = noteOrder.indexOf(root)
    if (index < 0) return chord
    index = (index + amount).mod(12)
    return noteOrder[index] + rest
}

private fun transposeSong(text: String, amount: Int): String = text
    .lines()
    .joinToString("\n") { line ->
        val regex = Regex("[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add|7|9|11|13|6|\\d)*(?:/[A-G](?:#|b)?)*")
        regex.replace(line) { result -> transposeChord(result.value, amount) }
    }

private fun activeKey(text: String): String =
    Regex("[A-G](?:#|b)?").find(text)?.value ?: "C"

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AcordesApp()
        }
    }
}

@Composable
private fun AcordesApp() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("harmona", 0) }

    fun loadSongs(): MutableList<Song> {
        val saved = prefs.getString(STORAGE_KEY, null) ?: return mutableListOf(defaultSong)
        return try {
            val array = JSONArray(saved)
            buildList {
                for (i in 0 until array.length()) {
                    val item = array.getJSONObject(i)
                    add(Song(item.getString("id"), item.getString("name"), item.getString("content")))
                }
            }.toMutableList().ifEmpty { mutableListOf(defaultSong) }
        } catch (_: Exception) {
            mutableListOf(defaultSong)
        }
    }

    var songs by remember { mutableStateOf(loadSongs()) }
    var selectedId by remember { mutableStateOf(songs.first().id) }
    val activeSong = songs.firstOrNull { it.id == selectedId } ?: songs.first()

    fun save() {
        val array = JSONArray()
        songs.forEach { song ->
            array.put(JSONObject().apply {
                put("id", song.id)
                put("name", song.name)
                put("content", song.content)
            })
        }
        prefs.edit().putString(STORAGE_KEY, array.toString()).apply()
    }

    fun updateActive(newSong: Song) {
        songs = songs.map { if (it.id == activeSong.id) newSong else it }.toMutableList()
        save()
    }

    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFFF59E0B),
            secondary = Color(0xFF7C3AED),
            background = Color(0xFF020617),
            surface = Color(0xFF0F172A),
            onBackground = Color(0xFFE2E8F0),
            onSurface = Color(0xFFE2E8F0)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .statusBarsPadding()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Harmona", color = Color(0xFFF59E0B), style = MaterialTheme.typography.labelLarge)
                    Text("Editor de acordes reais", style = MaterialTheme.typography.titleLarge)
                }
                AssistChip(
                    onClick = {},
                    label = { Text("Tom: ${activeKey(activeSong.content)}") }
                )
            }

            Spacer(Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = {
                    updateActive(activeSong.copy(content = transposeSong(activeSong.content, -1)))
                }) { Text("-1 tom") }
                OutlinedButton(onClick = {
                    updateActive(activeSong.copy(content = transposeSong(activeSong.content, 1)))
                }) { Text("+1 tom") }
            }

            Spacer(Modifier.height(12.dp))

            Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Card(
                    modifier = Modifier.width(130.dp).fillMaxHeight(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                ) {
                    Column(Modifier.padding(10.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Biblioteca", fontWeight = FontWeight.Bold)
                            IconButton(onClick = {
                                val newSong = Song(
                                    id = "${System.currentTimeMillis()}",
                                    name = "Música ${songs.size + 1}",
                                    content = "Tom: C\n\nC\nG\nAm\nF"
                                )
                                songs = (songs + newSong).toMutableList()
                                selectedId = newSong.id
                                save()
                            }) {
                                Icon(Icons.Default.Add, contentDescription = "Nova música")
                            }
                        }
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(songs, key = { it.id }) { song ->
                                val selected = song.id == selectedId
                                Surface(
                                    onClick = { selectedId = song.id },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (selected) Color(0xFF7C3AED) else Color(0x1FFFFFFF)
                                ) {
                                    Text(song.name, modifier = Modifier.padding(10.dp), maxLines = 1)
                                }
                            }
                        }
                    }
                }

                Column(modifier = Modifier.weight(1f).fillMaxHeight(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Card(
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                    ) {
                        Column(Modifier.fillMaxSize().padding(12.dp)) {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                OutlinedTextField(
                                    value = activeSong.name,
                                    onValueChange = { updateActive(activeSong.copy(name = it)) },
                                    modifier = Modifier.weight(1f),
                                    singleLine = true,
                                    label = { Text("Nome") }
                                )
                                IconButton(onClick = {
                                    if (songs.size == 1) {
                                        songs = mutableListOf(defaultSong)
                                        selectedId = defaultSong.id
                                    } else {
                                        val remaining = songs.filter { it.id != activeSong.id }
                                        songs = remaining.toMutableList()
                                        selectedId = remaining.first().id
                                    }
                                    save()
                                }) { Icon(Icons.Default.Delete, contentDescription = "Excluir") }
                            }
                            Spacer(Modifier.height(8.dp))
                            OutlinedTextField(
                                value = activeSong.content,
                                onValueChange = { updateActive(activeSong.copy(content = it)) },
                                modifier = Modifier.fillMaxWidth().weight(1f),
                                textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 14.sp)
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.height(220.dp).fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                    ) {
                        Column(Modifier.fillMaxSize().padding(12.dp)) {
                            Text("Pré-visualização", fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(8.dp))
                            Column(
                                modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                            ) {
                                activeSong.content.lines().forEach { line ->
                                    Text(line.ifEmpty { " " }, fontFamily = FontFamily.Monospace, fontSize = 14.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
