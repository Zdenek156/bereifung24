import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const RequestsScreen(),
    const AppointmentsScreen(),
    const VehiclesScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt),
            label: 'Anfragen',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: 'Termine',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.directions_car),
            label: 'Fahrzeuge',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Einstellungen',
          ),
        ],
      ),
    );
  }
}

// Placeholder screens
class RequestsScreen extends StatelessWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meine Anfragen'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.list_alt,
              size: 80,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            const Text(
              'Keine Anfragen vorhanden',
              style: TextStyle(
                fontSize: 18,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                // TODO: Navigate to create request screen
              },
              icon: const Icon(Icons.add),
              label: const Text('Neue Anfrage erstellen'),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to create request screen
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class AppointmentsScreen extends StatelessWidget {
  const AppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meine Termine'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calendar_today,
              size: 80,
              color: AppColors.textSecondary,
            ),
            SizedBox(height: 16),
            Text(
              'Keine Termine vorhanden',
              style: TextStyle(
                fontSize: 18,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class VehiclesScreen extends StatelessWidget {
  const VehiclesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meine Fahrzeuge'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.directions_car,
              size: 80,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            const Text(
              'Keine Fahrzeuge vorhanden',
              style: TextStyle(
                fontSize: 18,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                // TODO: Navigate to add vehicle screen
              },
              icon: const Icon(Icons.add),
              label: const Text('Fahrzeug hinzufügen'),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to add vehicle screen
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Einstellungen'),
      ),
      body: ListView(
        children: [
          const ListTile(
            leading: Icon(Icons.person),
            title: Text('Profil'),
            trailing: Icon(Icons.chevron_right),
          ),
          const ListTile(
            leading: Icon(Icons.notifications),
            title: Text('Benachrichtigungen'),
            trailing: Icon(Icons.chevron_right),
          ),
          const ListTile(
            leading: Icon(Icons.privacy_tip),
            title: Text('Datenschutz'),
            trailing: Icon(Icons.chevron_right),
          ),
          const ListTile(
            leading: Icon(Icons.help),
            title: Text('Hilfe & Support'),
            trailing: Icon(Icons.chevron_right),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text(
              'Abmelden',
              style: TextStyle(color: Colors.red),
            ),
            onTap: () {
              // TODO: Implement logout
            },
          ),
        ],
      ),
    );
  }
}